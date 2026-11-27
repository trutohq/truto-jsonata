import jsonata, { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import {
  castArray,
  chunk,
  compact,
  difference,
  filter,
  find,
  flatten,
  flattenDeep,
  flattenDepth,
  groupBy,
  isArray,
  join,
  keyBy,
  omit,
  orderBy,
  pick,
  values,
} from 'lodash-es'
import awsSigV4 from '../functions/awsSigV4'
import base64decode from '../functions/base64decode'
import base64encode from '../functions/base64encode'
import base64ToBlob from '../functions/base64ToBlob'
import blob from '../functions/blob'
import bufferToString from '../functions/bufferToString'
import convertCurrencyFromSubunit from '../functions/convertCurrencyFromSubunit'
import convertCurrencyToSubunit from '../functions/convertCurrencyToSubunit'
import dependencyGraph from '../functions/dependencyGraph'
import diceCoefficient from '../functions/diceCoefficient'
import digest from '../functions/digest'
import firstNonEmpty from '../functions/firstNonEmpty'
import getArrayBuffer from '../functions/getArrayBuffer'
import getDataUri from '../functions/getDataUri'
import getMimeType from '../functions/getMimeType'
import jsonParse from '../functions/jsonParse'
import mapValues from '../functions/mapValues'
import mostSimilar from '../functions/mostSimilar'
import parseDocument from '../functions/parseDocument'
import parseQuery from '../functions/parseQuery'
import parseUrl from '../functions/parseUrl'
import removeEmpty from '../functions/removeEmpty'
import removeEmptyItems from '../functions/removeEmptyItems'
import sign from '../functions/sign'
import sortNodes from '../functions/sortNodes'
import stringifyQuery from '../functions/stringifyQuery'
import teeStream from '../functions/teeStream'
import toMillis20 from '../functions/toMillis20'
import toNumber from '../functions/toNumber'
import {
  NATIVE_OBJECT,
  NATIVE_READABLE_STREAM,
  NATIVE_READABLE_STREAM_READER,
  unwrapNative,
} from '../functions/unwrapNative'
import uuid from '../functions/uuid'
import zipSqlResponse from '../functions/zipSqlResponse'

// Callbacks usually reach registered functions as jsonata-wrapped JS functions
// carrying the declared parameter count in `arity` (lambdas) or
// `implementation.length` (registered functions). `length` on the wrapper
// itself is always 0, so it is only a last-resort fallback.
// Inside a user-defined `function(...)` body jsonata passes the raw procedure
// object instead: a lambda (`_jsonata_lambda`, its own `apply(self, args)` and
// an `arguments` list) or a registered function (`implementation`). Neither is
// callable, so `invokeCallback` calls them the way jsonata's builtins do.
type JsonataCallable = ((...args: unknown[]) => unknown) & {
  arity?: number
  implementation?: (...args: unknown[]) => unknown
}
type JsonataProcedure = {
  arity?: number
  implementation?: (...args: unknown[]) => unknown
  signature?: { validate?: (args: unknown[], context: unknown) => unknown[] }
  arguments?: unknown[]
  apply?: (self: unknown, args: unknown[]) => unknown
}
type JsonataCallback = JsonataCallable | JsonataProcedure

type JsonataFunction = {
  _jsonata_function?: boolean
  _jsonata_lambda?: boolean
}

function isJsonataFunction(value: unknown): boolean {
  if (typeof value === 'function') return true
  if (!value || typeof value !== 'object') return false
  const func = value as JsonataFunction
  return func._jsonata_function === true || func._jsonata_lambda === true
}

// JSONata 2.1.1 stopped rounding integer values to 15 significant digits in
// $string. Existing mappings ran against 2.0.6, so preserve that output exactly
// at the truto-jsonata boundary (notably for large numeric IDs).
function legacyString(arg: unknown, prettify = false): string | undefined {
  const rawArg = unwrapNative(arg)
  if (rawArg === undefined) return undefined
  if (typeof rawArg === 'string') return rawArg
  if (isJsonataFunction(rawArg)) return ''
  if (typeof rawArg === 'number' && !Number.isFinite(rawArg)) {
    throw { code: 'D3001', value: rawArg, stack: new Error().stack }
  }

  const outerWrapped = rawArg as unknown[] & { outerWrapper?: boolean }
  const value =
    isArray(rawArg) && outerWrapped.outerWrapper ? rawArg[0] : rawArg

  return JSON.stringify(
    value,
    (_key, nested: unknown) => {
      const rawNested = unwrapNative(nested)
      if (typeof rawNested === 'number' && !Number.isNaN(rawNested)) {
        if (!Number.isFinite(rawNested)) {
          throw { code: 'D1001', value: rawNested, stack: new Error().stack }
        }
        return Number(rawNested.toPrecision(15))
      }
      return isJsonataFunction(rawNested) ? '' : rawNested
    },
    prettify ? 2 : 0
  )
}

// The 2.0 builtin returns a jsonata sequence: the evaluator collapses it to
// a single key (or to undefined when empty) at the call site, but a lambda
// that returns it in tail position hands the raw sequence to $map/$each, which
// keep ['k'] and [] as array entries. Return a sequence too so both cases
// match 2.0.
function sequenceOf(items: unknown[]): unknown[] {
  const sequence = items as unknown[] & { sequence?: boolean }
  sequence.sequence = true
  return sequence
}

function collectKeys(arg: unknown, keys: Set<string>) {
  const rawArg = unwrapNative(arg)
  if (isArray(rawArg)) {
    for (const item of rawArg) collectKeys(item, keys)
  } else if (
    rawArg !== null &&
    typeof rawArg === 'object' &&
    !isJsonataFunction(rawArg)
  ) {
    for (const key of Object.keys(rawArg)) keys.add(key)
  }
}

function legacyKeys(arg: unknown): unknown[] {
  const keys = new Set<string>()
  collectKeys(arg, keys)
  return sequenceOf([...keys])
}

function callbackArity(func: JsonataCallback): number {
  if (typeof func.arity === 'number') return func.arity
  if (typeof func.implementation === 'function') {
    return func.implementation.length
  }
  if (typeof func === 'function') return func.length
  return Array.isArray(func.arguments) ? func.arguments.length : 1
}

// `self` is the `this` jsonata gives the registered function (its focus:
// `{ environment, input }`), passed on so a raw lambda runs in the caller's
// environment exactly as it does under jsonata's own $each/$sift. A raw
// registered function is validated against its signature first, so a bad
// argument gives T0410 as it does at top level. A partial application
// (`$f(?, 1)`) arrives without `apply` and still fails with T1006 here, as it
// does under plain jsonata.
function invokeCallback(
  self: unknown,
  func: JsonataCallback,
  args: unknown[]
): unknown {
  if (typeof func === 'function') return func(...args)
  if (typeof func.implementation === 'function') {
    const validate = func.signature?.validate
    const input = (self as { input?: unknown } | undefined)?.input
    const validated = validate
      ? validate.call(func.signature, args, input)
      : args
    return func.implementation.apply(self, validated)
  }
  if (typeof func.apply === 'function') return func.apply(self, args)
  throw { code: 'T1006', stack: new Error().stack }
}

// Mirror of jsonata's internal hofFuncArgs: the value is always passed, the
// key and the whole object only if the callback declares those parameters.
// The arity is constant per $each/$sift call, so callers compute it once and
// pass it in instead of re-probing the callback for every key.
function callbackArgs(
  arity: number,
  value: unknown,
  key: string,
  obj: Record<string, unknown>
): unknown[] {
  const args: unknown[] = [value]
  if (arity >= 2) args.push(key)
  if (arity >= 3) args.push(obj)
  return args
}

// Mirror of jsonata 2.0's internal boolean(): the effective boolean value the
// builtin $sift applied to predicate results. Notably: function-shaped values
// (jsonata lambdas are plain objects) hit the object branch and count as
// truthy — that matches the 2.0 builtin, which had no isFunction exclusion —
// and non-finite numbers throw D1001 exactly like jsonata's isNumeric().
function effectiveBoolean(arg: unknown): boolean {
  if (arg === undefined || arg === null) return false
  if (isArray(arg)) return arg.some(effectiveBoolean)
  switch (typeof arg) {
    case 'boolean':
      return arg
    case 'string':
      return arg.length > 0
    case 'number':
      if (Number.isNaN(arg)) return false
      if (!Number.isFinite(arg)) {
        throw { code: 'D1001', stack: new Error().stack, value: arg }
      }
      return arg !== 0
    case 'object':
      return Object.keys(arg).length > 0
    default:
      // real JS functions and anything exotic
      return false
  }
}

// The keys 2.0's builtin $each and $sift walked, with for..in. On a native
// that also reaches the enumerable members its prototype defines (a Blob's
// size and type, a URL's href, a stream's getReader, …). A native wrapper
// lists only the native's own keys, so walk the native itself.
function walksNative(obj: object): boolean {
  return (
    NATIVE_OBJECT in obj ||
    NATIVE_READABLE_STREAM in obj ||
    NATIVE_READABLE_STREAM_READER in obj
  )
}

function forInKeys(obj: object): string[] {
  if (!walksNative(obj)) return Object.keys(obj)
  const keys: string[] = []
  for (const key in unwrapNative(obj) as object) keys.push(key)
  return keys
}

// 2.0's $merge and $spread walked keys with for..in too. Give the builtins a
// native wrapper as a plain object of those keys; anything else as-is. A key
// the wrapper does not answer (a stream's pipeTo) reads as undefined.
function forInView(value: unknown): unknown {
  if (!value || typeof value !== 'object' || !walksNative(value)) {
    return value
  }
  const view: Record<string, unknown> = {}
  for (const key of forInKeys(value)) {
    Object.defineProperty(view, key, {
      value: (value as Record<string, unknown>)[key],
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  return view
}

type NativeFunction = {
  implementation: (this: unknown, ...args: unknown[]) => unknown
}
const builtins = new Map<string, Promise<NativeFunction>>()

function builtin(name: string): Promise<NativeFunction> {
  let fn = builtins.get(name)
  if (!fn) {
    fn = jsonata('$' + name).evaluate({}) as Promise<NativeFunction>
    builtins.set(name, fn)
  }
  return fn
}

/** The builtin, with native wrappers in its argument seen as 2.0 saw them. */
function withForInView(name: string) {
  return async function (this: unknown, arg: unknown) {
    const view = Array.isArray(arg)
      ? arg.some(item => forInView(item) !== item) // rare: one extra view
        ? arg.map(forInView)
        : arg
      : forInView(arg)
    return (await builtin(name)).implementation.call(this, view)
  }
}

export function registerCoreExtensions(expression: Expression): Expression {
  registerHostFunction(expression, 'string', legacyString, '<x-b?:s>')
  registerHostFunction(expression, 'keys', legacyKeys, '<x-:a<s>>')
  registerHostFunction(expression, 'awsSigV4', awsSigV4)
  registerHostFunction(expression, 'base64decode', base64decode)
  registerHostFunction(expression, 'base64encode', base64encode)
  registerHostFunction(expression, 'base64ToBlob', base64ToBlob)
  registerHostFunction(expression, 'blob', blob)
  registerHostFunction(expression, 'bufferToString', bufferToString)
  registerHostFunction(
    expression,
    'convertCurrencyFromSubunit',
    convertCurrencyFromSubunit
  )
  registerHostFunction(
    expression,
    'convertCurrencyToSubunit',
    convertCurrencyToSubunit
  )
  registerHostFunction(expression, 'dependencyGraph', dependencyGraph)
  registerHostFunction(expression, 'diceCoefficient', diceCoefficient)
  registerHostFunction(expression, 'digest', digest)
  registerHostFunction(expression, 'firstNonEmpty', firstNonEmpty)
  registerHostFunction(expression, 'getArrayBuffer', getArrayBuffer)
  registerHostFunction(expression, 'getDataUri', getDataUri)
  registerHostFunction(expression, 'getMimeType', getMimeType)
  registerHostFunction(expression, 'jsonParse', jsonParse)
  registerHostFunction(expression, 'mapValues', mapValues)
  registerHostFunction(expression, 'mostSimilar', mostSimilar)
  registerHostFunction(expression, 'parseDocument', parseDocument)
  registerHostFunction(expression, 'parseQuery', parseQuery)
  registerHostFunction(expression, 'parseUrl', parseUrl)
  registerHostFunction(expression, 'removeEmpty', removeEmpty)
  registerHostFunction(expression, 'removeEmptyItems', removeEmptyItems)
  registerHostFunction(expression, 'sign', sign)
  registerHostFunction(expression, 'sortNodes', sortNodes)
  registerHostFunction(expression, 'stringifyQuery', stringifyQuery)
  registerHostFunction(expression, 'teeStream', teeStream)
  registerHostFunction(expression, 'toNumber', toNumber)
  registerHostFunction(expression, 'uuid', uuid)
  registerHostFunction(expression, 'zipSqlResponse', zipSqlResponse)

  // jsonata 2.2 changed $each and $sift to throw on undefined instead of
  // returning undefined. Override with undefined-safe versions that otherwise
  // replicate the 2.0 builtins exactly:
  // - registered with the builtin signatures so the context-injection idiom
  //   (`payload.$sift(function($v, $k) {...})`) keeps working — explicit null
  //   input is rejected by signature validation with T0410 before the body
  //   runs, matching the builtin (see the compat tests),
  // - callback args trimmed to the callback's arity so signatured callbacks
  //   (`$each(obj, $string)`) don't throw T0410,
  // - $sift keeps entries per JSONata effective-boolean semantics ($boolean),
  //   not JS truthiness, so e.g. empty arrays/objects are still dropped.
  //
  // Registered directly, not through registerHostFunction: they pass values on
  // to a JSONata callback, which must get them as JSONata sees them (a
  // DateTime wrapper, not a raw luxon DateTime it cannot read).
  expression.registerFunction(
    'each',
    async function (
      this: unknown,
      obj: Record<string, unknown> | undefined,
      func: JsonataCallback
    ) {
      if (obj === undefined) return undefined
      const arity = callbackArity(func)
      const result: unknown[] = []
      for (const key of forInKeys(obj)) {
        const val = await invokeCallback(
          this,
          func,
          callbackArgs(arity, obj[key], key, obj)
        )
        if (val !== undefined) result.push(val)
      }
      return sequenceOf(result)
    },
    '<o-f:a>'
  )

  expression.registerFunction(
    'sift',
    async function (
      this: unknown,
      obj: Record<string, unknown> | undefined,
      func: JsonataCallback
    ) {
      if (obj === undefined) return undefined
      const arity = callbackArity(func)
      const result: Record<string, unknown> = {}
      for (const key of forInKeys(obj)) {
        const keep = await invokeCallback(
          this,
          func,
          callbackArgs(arity, obj[key], key, obj)
        )
        if (effectiveBoolean(keep)) result[key] = obj[key]
      }
      return Object.keys(result).length === 0 ? undefined : result
    },
    '<o-f?:o>'
  )

  expression.registerFunction('merge', withForInView('merge'), '<a<o>:o>')
  expression.registerFunction('spread', withForInView('spread'), '<x-:a<o>>')

  // The builtin with 2.0's ISO 8601 check; same signature as the builtin.
  expression.registerFunction('toMillis', toMillis20, '<s-s?:n>')

  // lodash wrappers
  registerHostFunction(expression, 'groupBy', function (array: any, key: any) {
    return groupBy(castArray(array), key)
  })
  registerHostFunction(expression, 'keyBy', function (array: any, key: any) {
    return keyBy(castArray(array), key)
  })
  registerHostFunction(expression, 'pick', function (obj: any, keys: any) {
    return pick(obj, keys)
  })
  registerHostFunction(expression, 'omit', function (obj: any, keys: any) {
    return omit(obj, keys)
  })
  registerHostFunction(expression, 'compact', function (arr: any) {
    return compact(castArray(arr))
  })
  registerHostFunction(expression, 'join', function (arr: any, separator: any) {
    // Unwrap so a DateTime joins as its ISO text, as the raw luxon value did
    // under 2.0.
    return join(castArray(arr).map(unwrapNative), separator)
  })
  registerHostFunction(
    expression,
    'orderBy',
    function (arr: any, attr: any, order: any) {
      return orderBy(castArray(arr), attr, order)
    }
  )
  registerHostFunction(expression, 'find', function (arr: any, attr: any) {
    return find(castArray(arr), attr)
  })
  registerHostFunction(expression, 'lofilter', function (arr: any, attr: any) {
    return filter(castArray(arr), attr)
  })
  registerHostFunction(expression, 'values', function (obj: any) {
    return values(obj)
  })
  registerHostFunction(expression, 'chunk', function (arr: any, size: any) {
    return chunk(castArray(arr), size)
  })
  registerHostFunction(
    expression,
    'wrap',
    function (value: any, wrapper: any, endWrapper: any) {
      return join([wrapper, value, endWrapper || wrapper].map(unwrapNative), '')
    }
  )
  registerHostFunction(
    expression,
    'difference',
    function (arr1: any[], arr2: any[]) {
      return difference(arr1, arr2)
    }
  )
  registerHostFunction(expression, 'flatten', function (arr: any) {
    return flatten(castArray(arr))
  })
  registerHostFunction(expression, 'flattenDeep', function (arr: any) {
    return flattenDeep(castArray(arr))
  })
  registerHostFunction(
    expression,
    'flattenDepth',
    function (arr: any, depth: any) {
      return flattenDepth(castArray(arr), depth)
    }
  )

  return expression
}
