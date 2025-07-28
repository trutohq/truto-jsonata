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
} from 'lodash'
import base64decode from './functions/base64decode'
import base64encode from './functions/base64encode'
import base64ToBlob from './functions/base64ToBlob'
import blob from './functions/blob'
import bufferToString from './functions/bufferToString'
import convertCurrencyFromSubunit from './functions/convertCurrencyFromSubunit'
import convertCurrencyToSubunit from './functions/convertCurrencyToSubunit'
import convertHtmlToMarkdown from './functions/convertHtmlToMarkdown'
import convertMarkdownToGoogleDocs from './functions/convertMarkdownToGoogleDocs'
import convertMarkdownToHtml from './functions/convertMarkdownToHtml'
import convertMarkdownToNotion from './functions/convertMarkdownToNotion'
import convertMarkdownToSlack from './functions/convertMarkdownToSlack'
import convertNotionToMarkdown from './functions/convertNotionToMarkdown'
import convertNotionToMd from './functions/convertNotionToMd'
import convertQueryToSql from './functions/convertQueryToSql'
import digest from './functions/digest'
import dtFromFormat from './functions/dtFromFormat'
import dtFromIso from './functions/dtFromIso'
import firstNonEmpty from './functions/firstNonEmpty'
import generateEmbeddingsCohere from './functions/generateEmbeddingsCohere'
import getArrayBuffer from './functions/getArrayBuffer'
import getDataUri from './functions/getDataUri'
import getMimeType from './functions/getMimeType'
import jsonParse from './functions/jsonParse'
import jsToXml from './functions/jsToXml'
import mapValues from './functions/mapValues'
import mostSimilar from './functions/mostSimilar'
import parseDocument from './functions/parseDocument'
import parseQuery from './functions/parseQuery'
import parseUrl from './functions/parseUrl'
import { recursiveCharacterTextSplitter } from './functions/recursiveCharacterTextSplitter'
import removeEmpty from './functions/removeEmpty'
import removeEmptyItems from './functions/removeEmptyItems'
import sign from './functions/sign'
import sortNodes from './functions/sortNodes'
import stringifyQuery from './functions/stringifyQuery'
import teeStream from './functions/teeStream'
import toNumber from './functions/toNumber'
import uuid from './functions/uuid'
import xmlToJs from './functions/xmlToJs'
import zipSqlResponse from './functions/zipSqlResponse'

export default function registerJsonataExtensions(expression: Expression) {
  expression.registerFunction('dtFromIso', dtFromIso)
  expression.registerFunction('base64decode', base64decode)
  expression.registerFunction('base64encode', base64encode)
  expression.registerFunction('base64ToBlob', base64ToBlob)
  expression.registerFunction('dtFromFormat', dtFromFormat)
  expression.registerFunction('removeEmpty', removeEmpty)
  expression.registerFunction('removeEmptyItems', removeEmptyItems)
  expression.registerFunction(
    'convertCurrencyToSubunit',
    convertCurrencyToSubunit
  )
  expression.registerFunction(
    'convertCurrencyFromSubunit',
    convertCurrencyFromSubunit
  )
  expression.registerFunction('convertQueryToSql', convertQueryToSql)
  expression.registerFunction('mapValues', mapValues)
  expression.registerFunction('zipSqlResponse', zipSqlResponse)
  expression.registerFunction('firstNonEmpty', firstNonEmpty)
  expression.registerFunction('convertNotionToMd', convertNotionToMd)
  expression.registerFunction(
    'convertNotionToMarkdown',
    convertNotionToMarkdown
  )
  expression.registerFunction(
    'convertMarkdownToGoogleDocs',
    convertMarkdownToGoogleDocs
  )
  expression.registerFunction(
    'convertMarkdownToNotion',
    convertMarkdownToNotion
  )
  expression.registerFunction('convertMarkdownToSlack', convertMarkdownToSlack)
  expression.registerFunction('parseUrl', parseUrl)
  expression.registerFunction(
    'difference',
    function (arr1: any[], arr2: any[]) {
      return difference(arr1, arr2)
    }
  )
  expression.registerFunction('toNumber', toNumber)
  expression.registerFunction('jsonParse', jsonParse)
  expression.registerFunction('getMimeType', getMimeType)
  expression.registerFunction('uuid', uuid)
  expression.registerFunction('getArrayBuffer', getArrayBuffer)
  expression.registerFunction('mostSimilar', mostSimilar)
  expression.registerFunction('sortNodes', sortNodes)
  expression.registerFunction('blob', blob)
  expression.registerFunction('convertHtmlToMarkdown', convertHtmlToMarkdown)
  expression.registerFunction('convertMarkdownToHtml', convertMarkdownToHtml)
  expression.registerFunction('digest', digest)
  expression.registerFunction('sign', sign)
  expression.registerFunction('xmlToJs', xmlToJs)
  expression.registerFunction('jsToXml', jsToXml)
  expression.registerFunction(
    'generateEmbeddingsCohere',
    generateEmbeddingsCohere
  )
  expression.registerFunction('groupBy', function (array, key) {
    return groupBy(castArray(array), key)
  })
  expression.registerFunction('keyBy', function (array, key) {
    return keyBy(castArray(array), key)
  })
  expression.registerFunction('pick', function (obj, keys) {
    return pick(obj, keys)
  })
  expression.registerFunction('omit', function (obj, keys) {
    return omit(obj, keys)
  })
  expression.registerFunction('compact', function (arr) {
    return compact(castArray(arr))
  })
  expression.registerFunction('join', function (arr, separator) {
    return join(castArray(arr), separator)
  })
  expression.registerFunction('orderBy', function (arr, attr, order) {
    return orderBy(castArray(arr), attr, order)
  })
  expression.registerFunction('find', function (arr, attr) {
    return find(castArray(arr), attr)
  })
  expression.registerFunction('lofilter', function (arr, attr) {
    return filter(castArray(arr), attr)
  })
  expression.registerFunction('values', function (obj) {
    return values(obj)
  })
  expression.registerFunction('chunk', function (arr, size) {
    return chunk(castArray(arr), size)
  })
  expression.registerFunction('wrap', function (value, wrapper, endWrapper) {
    return join([wrapper, value, endWrapper || wrapper], '')
  })
  expression.registerFunction('parseDocument', parseDocument)
  expression.registerFunction(
    'recursiveCharacterTextSplitter',
    recursiveCharacterTextSplitter
  )
  expression.registerFunction('getDataUri', getDataUri)
  expression.registerFunction('teeStream', teeStream)
  expression.registerFunction('bufferToString', bufferToString)
  expression.registerFunction('parseQuery', parseQuery)
  expression.registerFunction('stringifyQuery', stringifyQuery)

  expression.registerFunction('flatten', function (arr) {
    return flatten(castArray(arr))
  })
  expression.registerFunction('flattenDeep', function (arr) {
    return flattenDeep(castArray(arr))
  })
  expression.registerFunction('flattenDepth', function (arr, depth) {
    return flattenDepth(castArray(arr), depth)
  })
  return expression
}
