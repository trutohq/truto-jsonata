import { Expression } from 'jsonata'
import convertQueryToSql from './functions/convertQueryToSql'
import mapValues from './functions/mapValues'
import convertMarkdownToGoogleDocs from './functions/convertMarkdownToGoogleDocs'
import convertMarkdownToNotion from './functions/convertMarkdownToNotion'
import convertMarkdownToSlack from './functions/convertMarkdownToSlack'
import mostSimilar from './functions/mostSimilar'
import sortNodes from './functions/sortNodes'
import convertHtmlToMarkdown from './functions/convertHtmlToMarkdown'
import digest from './functions/digest'
import convertNotionToMarkdown from './functions/convertNotionToMarkdown'
import sign from './functions/sign'
import xmlToJs from './functions/xmlToJs'
import jsToXml from './functions/jsToXml'
import dtFromIso from './functions/dtFromIso'
import dtFromFormat from './functions/dtFromFormat'
import removeEmpty from './functions/removeEmpty'
import removeEmptyItems from './functions/removeEmptyItems'
import convertNotionToMd from './functions/convertNotionToMd'
import parseUrl from './functions/parseUrl'
import differenceArray from './functions/difference'
import JsonParsefunction from './functions/jsonParse'
import getMimeType from './functions/getMimeType'
import generateUUID from './functions/uuid'
import encodebase64 from './functions/base64encode'
import convertCurrencyToSubunit from './functions/convertCurrencyToSubunit'
import convertCurrencyFromSubunit from './functions/convertCurrencyFromSubunit'
import firstNonEmpty from './functions/firstNonEmpty'
import getArrayBuffer from './functions/getArrayBuffer'
import blob from './functions/blob'
import zipSqlResponse from './functions/zipSqlResponse'
import decodebase64 from './functions/base64decode'

export default function registerJsonataExtensions(expression: Expression) {
  expression.registerFunction('dtFromIso', dtFromIso)
  expression.registerFunction('base64decode', decodebase64)
  expression.registerFunction('base64encode', encodebase64)
  expression.registerFunction('dtFromFormat', dtFromFormat)
  expression.registerFunction('removeEmpty', removeEmpty)
  expression.registerFunction('removeEmptyItems', removeEmptyItems)
  expression.registerFunction(
    'convertCurrencyToSubunit',
    convertCurrencyToSubunit,
  )
  expression.registerFunction(
    'convertCurrencyFromSubunit',
    convertCurrencyFromSubunit,
  )
  expression.registerFunction('convertQueryToSql', convertQueryToSql)
  expression.registerFunction('zipSqlResponse', zipSqlResponse)
  expression.registerFunction('convertNotionToMd', convertNotionToMd)
  expression.registerFunction('parseUrl', parseUrl)
  expression.registerFunction('firstNonEmpty', firstNonEmpty)
  expression.registerFunction('difference', differenceArray)
  expression.registerFunction('jsonParse', JsonParsefunction)
  expression.registerFunction('getMimeType', getMimeType)
  expression.registerFunction('uuid', generateUUID)
  expression.registerFunction('mapValues', mapValues)
  expression.registerFunction('mostSimilar', mostSimilar)
  expression.registerFunction('sortNodes', sortNodes)
  expression.registerFunction('convertHtmlToMarkdown', convertHtmlToMarkdown)
  expression.registerFunction('digest', digest)
  expression.registerFunction('sign', sign)
  expression.registerFunction('xmlToJs', xmlToJs)
  expression.registerFunction('jsToXml', jsToXml)
  expression.registerFunction('convertNotionToMd', convertNotionToMd)
  expression.registerFunction(
    'convertNotionToMarkdown',
    convertNotionToMarkdown,
  )
  expression.registerFunction(
    'convertMarkdownToGoogleDocs',
    convertMarkdownToGoogleDocs,
  )
  expression.registerFunction(
    'convertMarkdownToNotion',
    convertMarkdownToNotion,
  )
  expression.registerFunction('convertMarkdownToSlack', convertMarkdownToSlack)
  expression.registerFunction('getArrayBuffer', getArrayBuffer)
  expression.registerFunction('blob', blob)

  return expression
}
