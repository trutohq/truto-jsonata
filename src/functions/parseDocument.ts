import pRetry, { AbortError } from 'p-retry'
import { Focus } from 'jsonata'

async function parseDocument(
  this: Focus,
  file: string | Buffer | ReadableStream,
  fileType: string
) {
  const documentParserApiUrl = this.environment.lookup('documentParserApiUrl')
  const documentParserApiKey = this.environment.lookup('documentParserApiKey')
  if (!documentParserApiKey) {
    throw new Error('API key not found in environment')
  }

  return await pRetry(
    async () => {
      const response = await fetch(`${documentParserApiUrl}/parse`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': fileType,
          'user-agent': 'truto',
          Authorization: `Bearer ${documentParserApiKey}`,
        },
        body: file,
      })
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded')
        }
        if (response.status >= 500) {
          throw new Error('Server error')
        }
        throw new AbortError(await response.text())
      }
      const data = (await response.json()) as { content: string }
      return data.content
    },
    { retries: 5, maxTimeout: 5000, minTimeout: 2500 }
  )
}
export default parseDocument
