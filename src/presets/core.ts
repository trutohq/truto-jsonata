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
import uuid from '../functions/uuid'
import zipSqlResponse from '../functions/zipSqlResponse'

export function registerCoreExtensions(expression: Expression): Expression {
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
  expression.registerFunction(
    'flattenDepth',
    function (arr: any, depth: any) {
      return flattenDepth(castArray(arr), depth)
    }
  )

  return expression
}
