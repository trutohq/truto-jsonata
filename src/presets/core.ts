import { Expression } from 'jsonata'
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
import toNumber from '../functions/toNumber'
import { unwrapNative } from '../functions/unwrapNative'
import uuid from '../functions/uuid'
import zipSqlResponse from '../functions/zipSqlResponse'

// Callbacks reach registered functions as jsonata-wrapped JS functions
// carrying the declared parameter count in `arity` (lambdas) or
// `implementation.length` (registered functions). `length` on the wrapper
// itself is always 0, so it is only a last-resort fallback.
type JsonataCallback = ((...args: unknown[]) => unknown) & {
  arity?: number
  implementation?: (...args: unknown[]) => unknown
}

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

function legacyKeys(arg: unknown): string | string[] | undefined {
  const rawArg = unwrapNative(arg)
  const result: string[] = []
  if (isArray(rawArg)) {
    const keys = new Set<string>()
    for (const item of rawArg) {
      const itemKeys = legacyKeys(item)
      if (isArray(itemKeys)) {
        itemKeys.forEach(key => keys.add(key))
      } else if (itemKeys !== undefined) {
        keys.add(itemKeys)
      }
    }
    result.push(...keys)
  } else if (
    rawArg !== null &&
    typeof rawArg === 'object' &&
    !isJsonataFunction(rawArg)
  ) {
    result.push(...Object.keys(rawArg))
  }
  return result.length === 0
    ? undefined
    : result.length === 1
    ? result[0]
    : result
}

function callbackArity(func: JsonataCallback): number {
  if (typeof func.arity === 'number') return func.arity
  if (typeof func.implementation === 'function') {
    return func.implementation.length
  }
  return func.length
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

export function registerCoreExtensions(expression: Expression): Expression {
  expression.registerFunction('string', legacyString, '<x-b?:s>')
  expression.registerFunction('keys', legacyKeys, '<x-:a<s>>')
  expression.registerFunction('base64decode', base64decode)
  expression.registerFunction('base64encode', base64encode)
  expression.registerFunction('base64ToBlob', base64ToBlob)
  expression.registerFunction('blob', blob)
  expression.registerFunction('bufferToString', bufferToString)
  expression.registerFunction(
    'convertCurrencyFromSubunit',
    convertCurrencyFromSubunit
  )
  expression.registerFunction(
    'convertCurrencyToSubunit',
    convertCurrencyToSubunit
  )
  expression.registerFunction('dependencyGraph', dependencyGraph)
  expression.registerFunction('diceCoefficient', diceCoefficient)
  expression.registerFunction('digest', digest)
  expression.registerFunction('firstNonEmpty', firstNonEmpty)
  expression.registerFunction('getArrayBuffer', getArrayBuffer)
  expression.registerFunction('getDataUri', getDataUri)
  expression.registerFunction('getMimeType', getMimeType)
  expression.registerFunction('jsonParse', jsonParse)
  expression.registerFunction('mapValues', mapValues)
  expression.registerFunction('mostSimilar', mostSimilar)
  expression.registerFunction('parseDocument', parseDocument)
  expression.registerFunction('parseQuery', parseQuery)
  expression.registerFunction('parseUrl', parseUrl)
  expression.registerFunction('removeEmpty', removeEmpty)
  expression.registerFunction('removeEmptyItems', removeEmptyItems)
  expression.registerFunction('sign', sign)
  expression.registerFunction('sortNodes', sortNodes)
  expression.registerFunction('stringifyQuery', stringifyQuery)
  expression.registerFunction('teeStream', teeStream)
  expression.registerFunction('toNumber', toNumber)
  expression.registerFunction('uuid', uuid)
  expression.registerFunction('zipSqlResponse', zipSqlResponse)

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
  expression.registerFunction(
    'each',
    async function (
      obj: Record<string, unknown> | undefined,
      func: JsonataCallback
    ) {
      if (obj === undefined) return undefined
      const arity = callbackArity(func)
      const result: unknown[] = []
      for (const key of Object.keys(obj)) {
        const val = await func(...callbackArgs(arity, obj[key], key, obj))
        if (val !== undefined) result.push(val)
      }
      return result.length === 0
        ? undefined
        : result.length === 1
        ? result[0]
        : result
    },
    '<o-f:a>'
  )

  expression.registerFunction(
    'sift',
    async function (
      obj: Record<string, unknown> | undefined,
      func: JsonataCallback
    ) {
      if (obj === undefined) return undefined
      const arity = callbackArity(func)
      const result: Record<string, unknown> = {}
      for (const key of Object.keys(obj)) {
        const keep = await func(...callbackArgs(arity, obj[key], key, obj))
        if (effectiveBoolean(keep)) result[key] = obj[key]
      }
      return Object.keys(result).length === 0 ? undefined : result
    },
    '<o-f?:o>'
  )

  // lodash wrappers
  expression.registerFunction('groupBy', function (array: any, key: any) {
    return groupBy(castArray(array), key)
  })
  expression.registerFunction('keyBy', function (array: any, key: any) {
    return keyBy(castArray(array), key)
  })
  expression.registerFunction('pick', function (obj: any, keys: any) {
    return pick(obj, keys)
  })
  expression.registerFunction('omit', function (obj: any, keys: any) {
    return omit(obj, keys)
  })
  expression.registerFunction('compact', function (arr: any) {
    return compact(castArray(arr))
  })
  expression.registerFunction('join', function (arr: any, separator: any) {
    return join(castArray(arr), separator)
  })
  expression.registerFunction(
    'orderBy',
    function (arr: any, attr: any, order: any) {
      return orderBy(castArray(arr), attr, order)
    }
  )
  expression.registerFunction('find', function (arr: any, attr: any) {
    return find(castArray(arr), attr)
  })
  expression.registerFunction('lofilter', function (arr: any, attr: any) {
    return filter(castArray(arr), attr)
  })
  expression.registerFunction('values', function (obj: any) {
    return values(obj)
  })
  expression.registerFunction('chunk', function (arr: any, size: any) {
    return chunk(castArray(arr), size)
  })
  expression.registerFunction(
    'wrap',
    function (value: any, wrapper: any, endWrapper: any) {
      return join([wrapper, value, endWrapper || wrapper], '')
    }
  )
  expression.registerFunction(
    'difference',
    function (arr1: any[], arr2: any[]) {
      return difference(arr1, arr2)
    }
  )
  expression.registerFunction('flatten', function (arr: any) {
    return flatten(castArray(arr))
  })
  expression.registerFunction('flattenDeep', function (arr: any) {
    return flattenDeep(castArray(arr))
  })
  expression.registerFunction('flattenDepth', function (arr: any, depth: any) {
    return flattenDepth(castArray(arr), depth)
  })

  return expression
}
