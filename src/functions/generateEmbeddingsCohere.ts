async function generateEmbeddingsCohere(
  body: Record<string, unknown>,
  api_key: string
) {
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
}
export default generateEmbeddingsCohere
