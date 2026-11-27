import { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import dtFromFormat from '../functions/dtFromFormat'
import dtFromIso from '../functions/dtFromIso'

export function registerDatetimeExtensions(expression: Expression): Expression {
  registerHostFunction(expression, 'dtFromIso', dtFromIso)
  registerHostFunction(expression, 'dtFromFormat', dtFromFormat)
  return expression
}
