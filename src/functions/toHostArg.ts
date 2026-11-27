import { NATIVE_LUXON_DATE_TIME, unwrapNative } from './unwrapNative'

// jsonata array flags that change how the evaluator treats an array. A copy
// must keep them, or e.g. a singleton sequence stops collapsing.
const ARRAY_FLAGS = [
  'sequence',
  'keepSingleton',
  'outerWrapper',
  'tupleStream',
  'cons',
] as const

function isJsonataFunction(value: object): boolean {
  const func = value as {
    _jsonata_function?: unknown
    _jsonata_lambda?: unknown
  }
  return func._jsonata_function === true || func._jsonata_lambda === true
}

// Subtrees a walk returned unchanged, and the copy made for each JSONata
// value it changed. An expression that calls a function in a loop over the
// same value (`$find($$.rows, ...)` or `$find($built, ...)` inside `$map`)
// would otherwise walk or copy all of it at every call.
// ponytail: assumes a value does not change once walked. JSONata changes a
// value after it builds it in one place only: the transform operator
// (`~> | a | {...} |`) writes the update into its $clone copy. So every node
// $clone makes is marked MUTABLE (see trackedClone) and nothing that holds
// one is cached. A Truto function only gets values this walk already made
// host-shaped, so it cannot add a null-prototype object or a DateTime
// wrapper to a cached subtree. A Truto function that changes its argument in
// place changes the shared copy, which later calls then see, as they saw the
// shared value under JSONata 2.0. Drop the caches if that stops being true.
const CLEAN = new WeakSet<object>()
const COPIES = new WeakMap<object, unknown>()
const MUTABLE = new WeakSet<object>()

/** Mark every object and array in `value` as one JSONata may still change. */
export function markMutable(value: unknown) {
  if (!value || typeof value !== 'object' || MUTABLE.has(value)) return
  MUTABLE.add(value)
  for (const child of Object.values(value)) markMutable(child)
}

export type HostArgState = {
  unwrappedDateTime: boolean
  // false when the expression may bind its own $clone, which the caches
  // cannot track
  cache?: boolean
}

type Walk = {
  state: HostArgState
  // each node's result; an unchanged node maps to itself
  seen: Map<object, unknown>
  // times a node that maps to itself was reached again: a back-reference
  // in a cycle, or a node shared by two parents
  backRefs: number
  dateTimes: number
  // nodes JSONata may still change, reached in this walk
  mutable: number
  // copy every container up front, so back-references in a cycle that
  // changes point at the copies
  eager: boolean
}

/**
 * JSONata 2.2 builds expression objects (`{...}`, `$merge`, group-by, …) with
 * a null prototype. JSONata 2.0 did not, and Truto's helpers (lodash join,
 * String(), xml-js `hasOwnProperty`, …) were written against 2.0: on a
 * null-prototype object they throw instead of coercing. Give such objects
 * Object.prototype back before a Truto-registered function sees them.
 *
 * A DateTime wrapper is swapped for its luxon DateTime, which is what 2.0
 * passed (so String(), lodash and qs see the same value), and `state` records
 * it so the caller can wrap DateTimes in the result again. Other native
 * wrappers ($blob, $jsonToParquet, …) and jsonata functions pass through
 * untouched: the helpers unwrap those themselves.
 *
 * Copy-on-write: input-shaped values (already Object.prototype) are returned
 * as-is and nothing is allocated.
 */
export default function toHostArg(
  value: unknown,
  state: HostArgState = { unwrappedDateTime: false }
): unknown {
  if (!value || typeof value !== 'object') return value
  if (state.cache !== false && CLEAN.has(value)) return value
  const walk: Walk = {
    state,
    seen: new Map(),
    backRefs: 0,
    dateTimes: 0,
    mutable: 0,
    eager: false,
  }
  const result = toHostArgInner(value, walk)
  if (result === value || walk.backRefs === 0) return result
  // A cycle that changes: walk again, copying containers before their
  // children so back-references reach the copies.
  return toHostArgInner(value, {
    ...walk,
    seen: new Map(),
    eager: true,
  })
}

function toHostArgInner(value: unknown, walk: Walk): unknown {
  if (!value || typeof value !== 'object') return value
  const cache = walk.state.cache !== false
  if (cache && CLEAN.has(value)) return value
  const copied = cache ? COPIES.get(value) : undefined
  if (copied !== undefined) return copied
  const seen = walk.seen.get(value)
  if (seen !== undefined) {
    if (seen === value) walk.backRefs++
    return seen
  }
  // taken before this node counts, so a node that may change is not cached
  const mark = cacheMark(walk)
  if (MUTABLE.has(value)) walk.mutable++

  if (Array.isArray(value)) {
    let out: unknown[] | undefined = walk.eager ? [] : undefined
    walk.seen.set(value, out ?? value)
    for (let i = 0; i < value.length; i++) {
      const next = toHostArgInner(value[i], walk)
      if (out) {
        out.push(next)
      } else if (next !== value[i]) {
        out = value.slice(0, i)
        out.push(next)
      }
    }
    if (!out) {
      if (cache && cacheMark(walk) === mark) CLEAN.add(value)
      return value
    }
    const flags = value as unknown as Record<string, unknown>
    for (const flag of ARRAY_FLAGS) {
      if (flag in flags)
        (out as unknown as Record<string, unknown>)[flag] = flags[flag]
    }
    walk.seen.set(value, out)
    remember(value, out, walk, mark)
    return out
  }

  const proto = Object.getPrototypeOf(value)
  if (proto !== null && proto !== Object.prototype) return value
  if (NATIVE_LUXON_DATE_TIME in value) {
    walk.state.unwrappedDateTime = true
    walk.dateTimes++
    return (value as Record<symbol, unknown>)[NATIVE_LUXON_DATE_TIME]
  }
  if (isJsonataFunction(value) || unwrapNative(value) !== value) return value

  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  const out: Record<string, unknown> | undefined =
    walk.eager || proto === null ? {} : undefined
  walk.seen.set(value, out ?? value)
  let next: unknown[] | undefined
  for (let i = 0; i < keys.length; i++) {
    const child = record[keys[i]]
    const converted = toHostArgInner(child, walk)
    if (next) {
      next[i] = converted
    } else if (converted !== child) {
      next = new Array(keys.length)
      for (let j = 0; j < i; j++) next[j] = record[keys[j]]
      next[i] = converted
    }
  }
  if (!out && !next) {
    if (cache && cacheMark(walk) === mark) CLEAN.add(value)
    return value
  }
  const copy = out ?? {}
  for (let i = 0; i < keys.length; i++) {
    // Define rather than assign so a data key named "__proto__" stays data.
    Object.defineProperty(copy, keys[i], {
      value: next ? next[i] : record[keys[i]],
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  walk.seen.set(value, copy)
  remember(value, copy, walk, mark)
  return copy
}

// A subtree can be cached only when nothing in it depends on this walk or
// may change: no back-reference or shared node (a cycle), no unwrapped
// DateTime (whose result the caller must know to wrap again) and no node
// JSONata may still change. The sum moves whenever one of them is reached.
function cacheMark(walk: Walk) {
  return walk.backRefs + walk.dateTimes + walk.mutable
}

function remember(value: object, copy: object, walk: Walk, mark: number) {
  if (walk.state.cache === false || walk.eager || cacheMark(walk) !== mark)
    return
  COPIES.set(value, copy)
  CLEAN.add(copy)
}
