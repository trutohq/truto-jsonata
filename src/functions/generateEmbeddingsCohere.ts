async function generateEmbeddingsCohere(
  body: Record<string, unknown>,
  api_key: string
) {
  try {
    const response = await fetch('https://api.cohere.com/v2/embed', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify(body),
    })

    return await response.json()
  } catch (error) {
    return error
  }
}
export default generateEmbeddingsCohere
