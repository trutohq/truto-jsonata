import { castArray, chunk, isEmpty } from 'lodash-es'
import pMap from 'p-map'
import pRetry, { AbortError } from 'p-retry'

async function generateEmbeddingsCohere(
  body: Record<string, unknown>,
  api_key: string
) {
  if (!isEmpty(body.texts)) {
    const chunks = chunk(castArray(body.texts), 20)
    return await pMap(
      chunks,
      async chunk => {
        return await pRetry(
          async () => {
            const response = await fetch('https://api.cohere.com/v2/embed', {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent': 'truto',
                Authorization: `Bearer ${api_key}`,
              },
              body: JSON.stringify({ ...body, texts: chunk }),
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
            return await response.json()
          },
          { retries: 5, maxTimeout: 5000, minTimeout: 2500 }
        )
      },
      {
        concurrency: 1,
      }
    )
  } else if (!isEmpty(body.images)) {
    return await pRetry(
      async () => {
        const response = await fetch('https://api.cohere.com/v2/embed', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'user-agent': 'truto',
            Authorization: `Bearer ${api_key}`,
          },
          body: JSON.stringify(body),
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
        return await response.json()
      },
      { retries: 5, maxTimeout: 5000, minTimeout: 2500 }
    )
  }
}
export default generateEmbeddingsCohere
