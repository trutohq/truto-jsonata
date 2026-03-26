import { Expression } from 'jsonata'
import convertQueryToSql from '../functions/convertQueryToSql'
import jsonToCsv from '../functions/jsonToCsv'
import jsonToParquet from '../functions/jsonToParquet'
import jsToXml from '../functions/jsToXml'
import xmlToJs from '../functions/xmlToJs'

export function registerDataFormatsExtensions(
  expression: Expression
): Expression {
  expression.registerFunction('xmlToJs', xmlToJs)
  expression.registerFunction('jsToXml', jsToXml)
  expression.registerFunction('jsonToCsv', jsonToCsv)
  expression.registerFunction('jsonToParquet', jsonToParquet)
  expression.registerFunction('convertQueryToSql', convertQueryToSql)
  return expression
}
