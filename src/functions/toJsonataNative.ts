import { DateTime, Duration, Interval } from 'luxon'
import deepUnwrapNative from './deepUnwrapNative'
import {
  NATIVE_ARRAY_BUFFER,
  NATIVE_BLOB,
  NATIVE_LUXON_DATE_TIME,
  NATIVE_OBJECT,
  NATIVE_URL,
} from './unwrapNative'

// JSONata 2.0 read a native value's members through its prototype
// (`dt.toObject()`, `buf.byteLength`) and saw only its own keys when it
// listed, compared or serialized it (`dt.*`, `=`, `$string`, `? :`). 2.2 reads
// own properties only. A wrapper here is a Proxy that lists exactly the
// native's own keys and also answers, as hidden own properties, every member
// its prototype chain defines below Object.prototype. Members are read and
// methods run on the native itself; objects they return are wrapped the same
// way, so `dt.zone.name` and `dt.toJSDate().getTime()` work as they did.
//
// Nothing here ever hands the expression a raw function or a prototype
// object: a member or method result that is one reads as undefined, and the
// names below are never members. Expressions get data and these wrappers'
// own bound methods only.
const BLOCKED = new Set([
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
])

type Wrapper = Record<string | symbol, unknown>

type State = {
  native: object
  // the type-specific symbol unwrapNative and older helpers look for
  kind?: symbol
  methods: Map<string, unknown>
  // getter results, for natives that never change (luxon values, Blob):
  // JSONata 2.2 reads a property twice (hasOwnProperty, then get), and some
  // luxon getters (zoneName, offsetNameShort) go through Intl
  getters?: Map<string, unknown>
}

const STATE = new WeakMap<object, State>()
const WRAPPERS = new WeakMap<object, Wrapper>()

// Member names each prototype chain defines, stopping before the root
// prototype (Object.prototype, from any realm) so the Object methods stay out
// of reach.
const PROTO_MEMBERS = new WeakMap<object, Set<string>>()

function protoMembers(native: object): Set<string> {
  const proto = Object.getPrototypeOf(native)
  if (!proto || proto === Object.prototype) return new Set()
  let names = PROTO_MEMBERS.get(proto)
  if (names) return names
  names = new Set()
  for (
    let p = proto;
    p && Object.getPrototypeOf(p) !== null && p !== Function.prototype;
    p = Object.getPrototypeOf(p)
  ) {
    for (const name of Object.getOwnPropertyNames(p)) {
      if (!BLOCKED.has(name)) names.add(name)
    }
  }
  PROTO_MEMBERS.set(proto, names)
  return names
}

function isOwn(native: object, key: string) {
  return !BLOCKED.has(key) && Object.prototype.hasOwnProperty.call(native, key)
}

function isMember(native: object, key: string) {
  return isOwn(native, key) || protoMembers(native).has(key)
}

/** Object.prototype, Function.prototype or any class's prototype object. */
function isPrototypeObject(value: object): boolean {
  if (value === Object.prototype || value === Function.prototype) return true
  const ctor = Object.getOwnPropertyDescriptor(value, 'constructor')?.value
  return typeof ctor === 'function' && ctor.prototype === value
}

function isPlain(value: object): boolean {
  if (Array.isArray(value)) return true
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

// Does this plain array/object (or anything in it) hold a value that must
// change: a function, a prototype object, a blocked key or a class instance?
function needsChange(value: object, seen: Set<object>): boolean {
  if (seen.has(value)) return false
  seen.add(value)
  const array = Array.isArray(value)
  for (const key of Object.getOwnPropertyNames(value)) {
    if (array && key === 'length') continue
    if (BLOCKED.has(key)) return true
    const child = (value as Record<string, unknown>)[key]
    if (typeof child === 'function') return true
    if (!child || typeof child !== 'object') continue
    if (NATIVE_OBJECT in child) continue // a wrapper is already safe
    if (!isPlain(child) || isPrototypeObject(child)) return true
    if (needsChange(child, seen)) return true
  }
  return false
}

function copyPlain(value: object, seen: Map<object, unknown>): unknown {
  const done = seen.get(value)
  if (done !== undefined) return done
  if (Array.isArray(value)) {
    const out: unknown[] = []
    seen.set(value, out)
    for (const item of value) out.push(safeValue(item, seen))
    return out
  }
  const out = Object.create(Object.getPrototypeOf(value)) as object
  seen.set(value, out)
  for (const key of Object.getOwnPropertyNames(value)) {
    if (BLOCKED.has(key)) continue
    const next = safeValue((value as Record<string, unknown>)[key], seen)
    if (next === undefined) continue
    Object.defineProperty(out, key, {
      value: next,
      enumerable: Object.prototype.propertyIsEnumerable.call(value, key),
      configurable: true,
      writable: true,
    })
  }
  return out
}

function safeValue(value: unknown, seen?: Map<object, unknown>): unknown {
  if (typeof value === 'function') return undefined
  if (!value || typeof value !== 'object') return value
  if (NATIVE_OBJECT in value) return value // already a wrapper
  if (isPrototypeObject(value)) return undefined
  if (value instanceof Promise) return value.then(v => safeValue(v))
  if (!isPlain(value)) return toJsonataNative(value)
  if (seen) return copyPlain(value, seen)
  // plain data is almost always clean: copy only when something must change
  return needsChange(value, new Set()) ? copyPlain(value, new Map()) : value
}

// Natives whose getters always give the same answer. A URL (searchParams can
// change it), an ArrayBuffer (transfer empties it) or a Date is read fresh.
function unchanging(native: object): boolean {
  return (
    DateTime.isDateTime(native) ||
    Duration.isDuration(native) ||
    Interval.isInterval(native) ||
    (typeof Blob !== 'undefined' && native instanceof Blob)
  )
}

function kindOf(native: object): symbol | undefined {
  if (DateTime.isDateTime(native)) return NATIVE_LUXON_DATE_TIME
  if (typeof Blob !== 'undefined' && native instanceof Blob) return NATIVE_BLOB
  if (native instanceof ArrayBuffer) return NATIVE_ARRAY_BUFFER
  if (typeof URL !== 'undefined' && native instanceof URL) return NATIVE_URL
  return undefined
}

/**
 * The value as JSONata 2.2 must see it: class instances wrapped, functions
 * and prototype objects dropped, plain data as-is (copied only when something
 * inside it must change).
 */
export function toJsonataValue(value: unknown): unknown {
  return safeValue(value)
}

function member(state: State, key: string): unknown {
  const { native, getters } = state
  if (!isMember(native, key)) return undefined
  if (getters?.has(key)) return getters.get(key)
  const value = Reflect.get(native, key, native)
  if (typeof value !== 'function') {
    const out = toJsonataValue(value)
    if (getters && !isOwn(native, key)) getters.set(key, out)
    return out
  }
  let method = state.methods.get(key)
  if (!method) {
    const fn = value as (...args: unknown[]) => unknown
    method = (...args: unknown[]) =>
      toJsonataValue(Reflect.apply(fn, native, args.map(deepUnwrapNative)))
    state.methods.set(key, method)
  }
  return method
}

function descriptor(
  state: State,
  key: string
): PropertyDescriptor | undefined {
  if (BLOCKED.has(key)) return undefined
  const own = Reflect.getOwnPropertyDescriptor(state.native, key)
  if (own) {
    return {
      value: member(state, key),
      writable: true,
      enumerable: own.enumerable,
      configurable: true,
    }
  }
  if (!protoMembers(state.native).has(key)) return undefined
  return {
    value: member(state, key),
    writable: false,
    enumerable: false,
    configurable: true,
  }
}

function marker(state: State, key: symbol) {
  return key === NATIVE_OBJECT || key === state.kind
}

// Once frozen (Object.freeze calls preventExtensions first), the target holds
// a copy of every member and answers for itself, as the Proxy rules require.
const frozen = (target: Wrapper) => !Object.isExtensible(target)

const HANDLER: ProxyHandler<Wrapper> = {
  get(target, key) {
    const state = STATE.get(target) as State
    if (typeof key === 'symbol') {
      return marker(state, key) ? state.native : undefined
    }
    return frozen(target) ? target[key] : member(state, key)
  },
  has(target, key) {
    const state = STATE.get(target) as State
    if (typeof key === 'symbol') return marker(state, key)
    if (frozen(target)) return key in target
    return isMember(state.native, key)
  },
  getOwnPropertyDescriptor(target, key) {
    if (frozen(target) || typeof key === 'symbol') {
      return Reflect.getOwnPropertyDescriptor(target, key)
    }
    return descriptor(STATE.get(target) as State, key)
  },
  ownKeys(target) {
    if (frozen(target)) return Reflect.ownKeys(target)
    const { native } = STATE.get(target) as State
    return Reflect.ownKeys(native).filter(
      key => typeof key === 'string' && !BLOCKED.has(key)
    )
  },
  preventExtensions(target) {
    const state = STATE.get(target) as State
    for (const key of [
      ...Reflect.ownKeys(state.native).filter(
        k => typeof k === 'string' && !BLOCKED.has(k)
      ),
      ...protoMembers(state.native),
    ] as string[]) {
      const desc = descriptor(state, key)
      if (desc) Object.defineProperty(target, key, desc)
    }
    return Reflect.preventExtensions(target)
  },
  defineProperty(target, key, desc) {
    return frozen(target) ? Reflect.defineProperty(target, key, desc) : false
  },
  set: () => false,
  deleteProperty: () => false,
}

/**
 * Wrap a native (luxon DateTime/Duration/Interval, Date, Blob, ArrayBuffer,
 * URL, …) so JSONata 2.2 reads it as JSONata 2.0 read the native itself. The
 * same native always gives the same wrapper; unwrapNative gives the native.
 */
export function toJsonataNative(native: object): Wrapper {
  let wrapper = WRAPPERS.get(native)
  if (wrapper) return wrapper
  const target: Wrapper = {}
  STATE.set(target, {
    native,
    kind: kindOf(native),
    methods: new Map(),
    getters: unchanging(native) ? new Map() : undefined,
  })
  wrapper = new Proxy(target, HANDLER)
  WRAPPERS.set(native, wrapper)
  return wrapper
}

/** The wrapper already made for this native, if any. */
export function existingJsonataNative(native: object): Wrapper | undefined {
  return WRAPPERS.get(native)
}
