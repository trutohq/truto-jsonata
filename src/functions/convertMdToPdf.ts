import { Focus } from 'jsonata'
import pRetry, { AbortError } from 'p-retry'
import { includes, split, trim } from 'lodash-es'

type PdfOptions = {
  title?: string
  pageSize?: 'A4' | 'Letter' | string
  margin?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  embedImages?: boolean
  preferCssPageSize?: boolean
  styles?: string
  baseUrl?: string
  filename?: string
}

type AssetHeaders = Record<string, string>

function getFilenameFromHeaders(resp: Response, fallback?: string): string {
  const cd = resp.headers.get('content-disposition') || ''
  const matchStar = cd.match(/filename\*=([^;]+)/i)
  if (matchStar) {
    const value = trim(matchStar[1])
    const parts = split(value, "''")
    if (parts.length === 2) {
      try {
        return decodeURIComponent(parts[1])
      } catch {
        return parts[1]
      }
    }
    return trim(value, '\'"')
  }
  const match = cd.match(/filename="?([^";]+)"?/i)
  if (match) return match[1]
  return fallback || 'document.pdf'
}

async function convertMdToPdf(
  this: Focus,
  markdown: string,
  options: PdfOptions = {},
  assetHeaders: AssetHeaders = {}
): Promise<Blob> {
  const documentParserApiUrl = this.environment.lookup('documentParserApiUrl')
  const documentParserApiKey = this.environment.lookup('documentParserApiKey')

  if (!documentParserApiKey) {
    throw new Error('Document parser API key not found in environment')
  }

  if (!documentParserApiUrl) {
    throw new Error('Document parser API URL not found in environment')
  }

  if (!markdown || typeof markdown !== 'string') {
    throw new AbortError('Markdown content is required and must be a string')
  }

  const requestBody = {
    markdown,
    options,
    assetHeaders,
  }

  return await pRetry(
    async () => {
      const response = await fetch(`${documentParserApiUrl}/md-to-pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${documentParserApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/pdf',
          'User-Agent': 'truto',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded')
        }
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`)
        }
        const errorText = await response.text()
        let errorMessage = `PDF conversion failed (${response.status})`

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          errorMessage += `: ${errorText}`
        }

        throw new AbortError(errorMessage)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !includes(contentType, 'application/pdf')) {
        throw new AbortError(`Expected PDF but received: ${contentType}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const filename = getFilenameFromHeaders(response, options.filename)
      const blob: any = new Blob([arrayBuffer], { type: 'application/pdf' })
      blob.name = filename
      return blob
    },
    {
      retries: 5,
      maxTimeout: 30000,
      minTimeout: 2500,
      onFailedAttempt: error => {
        console.warn(
          `PDF conversion attempt ${error.attemptNumber} failed:`,
          error.message
        )
      },
    }
  )
}
export { convertMdToPdf as default }
