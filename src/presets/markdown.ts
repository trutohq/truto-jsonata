import { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import convertMarkdownToAdf from '../functions/convertMarkdownToAdf'
import convertMarkdownToGoogleDocs from '../functions/convertMarkdownToGoogleDocs'
import convertMarkdownToHtml from '../functions/convertMarkdownToHtml'
import convertMarkdownToNotion from '../functions/convertMarkdownToNotion'
import convertMarkdownToSlack from '../functions/convertMarkdownToSlack'
import convertMdToPdf from '../functions/convertMdToPdf'
import convertNotionToMarkdown from '../functions/convertNotionToMarkdown'
import convertNotionToMd from '../functions/convertNotionToMd'

export function registerMarkdownExtensions(expression: Expression): Expression {
  registerHostFunction(expression, 'convertMarkdownToAdf', convertMarkdownToAdf)
  registerHostFunction(
    expression,
    'convertMarkdownToGoogleDocs',
    convertMarkdownToGoogleDocs
  )
  registerHostFunction(
    expression,
    'convertMarkdownToHtml',
    convertMarkdownToHtml
  )
  registerHostFunction(
    expression,
    'convertMarkdownToNotion',
    convertMarkdownToNotion
  )
  registerHostFunction(
    expression,
    'convertMarkdownToSlack',
    convertMarkdownToSlack
  )
  registerHostFunction(expression, 'convertMdToPdf', convertMdToPdf)
  registerHostFunction(
    expression,
    'convertNotionToMarkdown',
    convertNotionToMarkdown
  )
  registerHostFunction(expression, 'convertNotionToMd', convertNotionToMd)
  return expression
}
