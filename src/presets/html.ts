import { Expression } from 'jsonata'
import convertHtmlToMarkdown from '../functions/convertHtmlToMarkdown'

export function registerHtmlExtensions(expression: Expression): Expression {
  expression.registerFunction('convertHtmlToMarkdown', convertHtmlToMarkdown)
  return expression
}
