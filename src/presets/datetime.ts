import { Expression } from 'jsonata'
import dtFromFormat from '../functions/dtFromFormat'
import dtFromIso from '../functions/dtFromIso'

export function registerDatetimeExtensions(expression: Expression): Expression {
  expression.registerFunction('dtFromIso', dtFromIso)
  expression.registerFunction('dtFromFormat', dtFromFormat)
  return expression
}
