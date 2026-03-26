import { Expression } from 'jsonata'
import convertMarkdownToAdf from '../functions/convertMarkdownToAdf'
import convertMarkdownToGoogleDocs from '../functions/convertMarkdownToGoogleDocs'
import convertMarkdownToHtml from '../functions/convertMarkdownToHtml'
import convertMarkdownToNotion from '../functions/convertMarkdownToNotion'
import convertMarkdownToSlack from '../functions/convertMarkdownToSlack'
import convertMdToPdf from '../functions/convertMdToPdf'
import convertNotionToMarkdown from '../functions/convertNotionToMarkdown'
import convertNotionToMd from '../functions/convertNotionToMd'

export function registerMarkdownExtensions(
  expression: Expression
): Expression {
  expression.registerFunction('convertMarkdownToAdf', convertMarkdownToAdf)
  expression.registerFunction(
    'convertMarkdownToGoogleDocs',
    convertMarkdownToGoogleDocs
  )
  expression.registerFunction('convertMarkdownToHtml', convertMarkdownToHtml)
  expression.registerFunction(
    'convertMarkdownToNotion',
    convertMarkdownToNotion
  )
  expression.registerFunction('convertMarkdownToSlack', convertMarkdownToSlack)
  expression.registerFunction('convertMdToPdf', convertMdToPdf)
  expression.registerFunction(
    'convertNotionToMarkdown',
    convertNotionToMarkdown
  )
  expression.registerFunction('convertNotionToMd', convertNotionToMd)
  return expression
}
