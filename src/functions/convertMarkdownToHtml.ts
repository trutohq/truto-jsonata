import { marked } from 'marked'

async function convertMarkdownToHtml(markdown: string): Promise<string> {
  return marked.parse(markdown)
}

export default convertMarkdownToHtml
