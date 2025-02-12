import { castArray, chunk, isEmpty } from 'lodash-es'
import pMap from 'p-map'
import pRetry from 'p-retry'

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
              throw new Error(await response.text())
            }
            return await response.json()
          },
          { retries: 10, maxTimeout: 600000 }
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
          throw new Error(await response.text())
        }
        return await response.json()
      },
      { retries: 10, maxTimeout: 600000 }
    )
  }
}
export default generateEmbeddingsCohere
