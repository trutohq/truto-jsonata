// @ts-ignore
import { createDocument } from '@mixmark-io/domino'
import { gfm } from '@truto/turndown-plugin-gfm'
import TurndownService from 'turndown'

const convertHtmlToMarkdown = (html: string) => {
  const htmlDoc = createDocument(html)
  const turndownService = new TurndownService()
  turndownService.use(gfm)
  return turndownService.turndown(htmlDoc)
}
export default convertHtmlToMarkdown
