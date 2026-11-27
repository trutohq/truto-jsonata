import { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import convertHtmlToMarkdown from '../functions/convertHtmlToMarkdown'

export function registerHtmlExtensions(expression: Expression): Expression {
  registerHostFunction(
    expression,
    'convertHtmlToMarkdown',
    convertHtmlToMarkdown
  )
  return expression
}
