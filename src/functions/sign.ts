import arrayBufferToBase64 from './arrayBufferToBase64'
import { webcrypto as crypto } from 'crypto'

const sign = async (
  text: string,
  algorithm = 'SHA-256',
  secret: string,
  outputFormat = 'hex',
) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.sign('HMAC', key, data)
  if (outputFormat === 'hex') {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else if (outputFormat === 'base64') {
    return arrayBufferToBase64(hashBuffer)
  } else if (outputFormat === 'base64-urlSafe') {
    return arrayBufferToBase64(hashBuffer, true)
  }
}

export default sign
