import arrayBufferToBase64 from './arrayBufferToBase64'

const digest = async (
  text: string,
  algorithm = 'SHA-256',
  stringType = 'hex'
) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  if (stringType === 'hex') {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else if (stringType === 'base64') {
    return arrayBufferToBase64(hashBuffer)
  } else if (stringType === 'base64-urlSafe') {
    return arrayBufferToBase64(hashBuffer, true)
  }
}

export default digest
