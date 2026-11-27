import { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import convertQueryToSql from '../functions/convertQueryToSql'
import jsonToCsv from '../functions/jsonToCsv'
import jsonToParquet from '../functions/jsonToParquet'
import jsToXml from '../functions/jsToXml'
import xmlToJs from '../functions/xmlToJs'

export function registerDataFormatsExtensions(
  expression: Expression
): Expression {
  registerHostFunction(expression, 'xmlToJs', xmlToJs)
  registerHostFunction(expression, 'jsToXml', jsToXml)
  registerHostFunction(expression, 'jsonToCsv', jsonToCsv)
  registerHostFunction(expression, 'jsonToParquet', jsonToParquet)
  registerHostFunction(expression, 'convertQueryToSql', convertQueryToSql)
  return expression
}
