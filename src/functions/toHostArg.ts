import deepUnwrapNative from './deepUnwrapNative'
import { NATIVE_OBJECT, unwrapNative } from './unwrapNative'

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

const HOST_LAMBDAS = new WeakMap<object, object>()
// copy -> the lambda it was made from
const LAMBDA_ORIGINALS = new WeakMap<object, object>()
// per evaluation (keyed by its root frame): input -> host-shaped input
const HOST_INPUTS = new WeakMap<object, WeakMap<object, unknown>>()

// The input a lambda closes over, with the natives 2.0 held there: the
// readable copies made for evaluation (mirrorNativeInput) swapped back. Kept
// for one evaluation only, so input the caller edits between two evaluations
// is read fresh.
function toHostInput(input: unknown, root: object): unknown {
  if (!input || typeof input !== 'object') return input
  let inputs = HOST_INPUTS.get(root)
  if (!inputs) {
    inputs = new WeakMap()
    HOST_INPUTS.set(root, inputs)
  }
  let host = inputs.get(input)
  if (host === undefined) {
    host = deepUnwrapNative(input)
    inputs.set(input, host)
  }
  return host
}

/** The lambda a toHostArg copy was made from, if `value` is one. */
export function originalLambda(value: object): object | undefined {
  return LAMBDA_ORIGINALS.get(value)
}

// JSONata 2.2 gives every frame a `base` link back to the root frame, which
// links to itself, so a lambda is a cycle and a Truto function that
// serializes or walks its arguments (JSON, xml-js, qs, lodash) overflows.
// JSONata 2.0 frames had no `base`. Hand over a copy whose environment keeps
// `base` but hides it from enumeration, and whose input holds the host
// natives, so the helper sees the 2.0 shape. A copy the helper returns goes
// back to the original lambda (see mirrorNativeInput), so it runs as before.
function toHostLambda(lambda: object): object {
  const environment = (lambda as { environment?: unknown }).environment
  if (
    !environment ||
    typeof environment !== 'object' ||
    !Object.prototype.propertyIsEnumerable.call(environment, 'base')
  ) {
    return lambda
  }
  let copy = HOST_LAMBDAS.get(lambda)
  if (copy) return copy
  const root = (environment as { base?: unknown }).base
  const env: Record<string, unknown> = {}
  for (const key of Object.keys(environment)) {
    Object.defineProperty(env, key, {
      value: (environment as Record<string, unknown>)[key],
      enumerable: key !== 'base',
      configurable: true,
      writable: true,
    })
  }
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(lambda)) {
    Object.defineProperty(out, key, {
      value:
        key === 'environment'
          ? env
          : key === 'input'
            ? toHostInput(
                (lambda as Record<string, unknown>).input,
                root && typeof root === 'object' ? root : environment
              )
            : (lambda as Record<string, unknown>)[key],
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  HOST_LAMBDAS.set(lambda, out)
  LAMBDA_ORIGINALS.set(out, lambda)
  return out
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
// host-shaped, so it cannot add a null-prototype object or a native
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
  // a native wrapper was swapped for its native, so the caller must wrap
  // natives in the result again
  unwrappedNative: boolean
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
  natives: number
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
 * A native wrapper (DateTime, Blob, ArrayBuffer, …; see toJsonataNative) is
 * swapped for its native, which is what 2.0 passed (so String(), lodash and
 * qs see the same value), and `state` records it so the caller can wrap
 * natives in the result again. A lambda is handed over in its 2.0 shape (see
 * toHostLambda). Other wrappers and jsonata functions pass through untouched:
 * the helpers unwrap those themselves.
 *
 * Copy-on-write: input-shaped values (already Object.prototype) are returned
 * as-is and nothing is allocated.
 */
export default function toHostArg(
  value: unknown,
  state: HostArgState = { unwrappedNative: false }
): unknown {
  if (!value || typeof value !== 'object') return value
  if (state.cache !== false && CLEAN.has(value)) return value
  const walk: Walk = {
    state,
    seen: new Map(),
    backRefs: 0,
    natives: 0,
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
  if (NATIVE_OBJECT in value) {
    walk.state.unwrappedNative = true
    walk.natives++
    return (value as Record<symbol, unknown>)[NATIVE_OBJECT]
  }
  if ((value as { _jsonata_lambda?: unknown })._jsonata_lambda === true) {
    const copy = toHostLambda(value)
    if (copy !== value) {
      // the result must be walked to swap a returned copy back
      walk.state.unwrappedNative = true
      walk.natives++
    }
    return copy
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
// native (whose result the caller must know to wrap again) and no node
// JSONata may still change. The sum moves whenever one of them is reached.
function cacheMark(walk: Walk) {
  return walk.backRefs + walk.natives + walk.mutable
}

function remember(value: object, copy: object, walk: Walk, mark: number) {
  if (walk.state.cache === false || walk.eager || cacheMark(walk) !== mark)
    return
  COPIES.set(value, copy)
  CLEAN.add(copy)
}
