import { marked } from 'marked'

async function convertMarkdownToHtml(
  markdown: string,
  options: any
): Promise<string> {
  return marked.parse(markdown, options)
}

export default convertMarkdownToHtml
