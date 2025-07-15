// @ts-ignore
import { createDocument } from '@mixmark-io/domino'
import TurndownService from 'turndown'
// @ts-ignore
import { gfm } from '@joplin/turndown-plugin-gfm'

const convertHtmlToMarkdown = (html: string) => {
  const htmlDoc = createDocument(html)
  const turndownService = new TurndownService()
  turndownService.use(gfm)
  return turndownService.turndown(htmlDoc)
}
export default convertHtmlToMarkdown
