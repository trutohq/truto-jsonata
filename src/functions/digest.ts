import MD5 from 'md5.js'
import arrayBufferToBase64 from './arrayBufferToBase64'

const digest = async (
  text: string,
  algorithm = 'SHA-256',
  stringType = 'hex'
) => {
  // MD5 is not supported by Web Crypto API, so use md5.js library
  if (algorithm === 'MD5' || algorithm === 'md5') {
    const md5 = new MD5().update(text)
    if (stringType === 'hex') {
      return md5.digest('hex')
    } else {
      // Get Buffer from digest() and convert to base64
      const buffer = md5.digest()
      const base64 = buffer.toString('base64')
      if (stringType === 'base64-urlSafe') {
        // Convert base64 to url-safe format
        return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      }
      return base64
    }
  }

  // Use Web Crypto API for other algorithms (SHA-256, SHA-512, etc.)
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
