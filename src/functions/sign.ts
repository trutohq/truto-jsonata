import arrayBufferToBase64 from './arrayBufferToBase64'
const sign = async (
  text: string,
  algorithm = 'SHA-256',
  secret: string,
  outputFormat = 'hex'
) => {
  const upperAlg = String(algorithm ?? '')
    .trim()
    .toUpperCase()

  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  let signatureBuffer: ArrayBuffer
  if (upperAlg === 'RS256') {
    const pemKey = secret?.includes('\\n')
      ? secret.replace(/\\n/g, '\n')
      : secret
    if (!pemKey || !/-----BEGIN PRIVATE KEY-----/.test(pemKey)) {
      throw new Error(
        'RS256 requires a PKCS#8 PEM private key (BEGIN PRIVATE KEY)'
      )
    }

    const keyDataBase64 = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(keyDataBase64), c => c.charCodeAt(0))

    const rsaAlgorithm = {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    } as const

    let key: CryptoKey
    try {
      key = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        rsaAlgorithm,
        false,
        ['sign']
      )
    } catch (e: any) {
      throw new Error(
        `RS256 key import failed. Ensure an unencrypted PKCS#8 PEM (BEGIN PRIVATE KEY). Underlying: ${
          e?.message || e
        }`
      )
    }

    try {
      signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
    } catch (e: any) {
      throw new Error(
        `RS256 signing failed. Ensure the key matches RSASSA-PKCS1-v1_5 and data is correctly encoded. Underlying: ${
          e?.message || e
        }`
      )
    }
  } else {
    const hmacHash = upperAlg || 'SHA-256'
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: { name: hmacHash } },
      false,
      ['sign']
    )
    signatureBuffer = await crypto.subtle.sign('HMAC', key, data)
  }

  if (outputFormat === 'hex') {
    const bytes = Array.from(new Uint8Array(signatureBuffer))
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  } else if (outputFormat === 'base64') {
    return arrayBufferToBase64(signatureBuffer)
  } else if (outputFormat === 'base64-urlSafe') {
    return arrayBufferToBase64(signatureBuffer, true)
  }
}

export default sign
