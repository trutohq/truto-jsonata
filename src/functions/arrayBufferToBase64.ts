export default function arrayBufferToBase64(
  buffer: ArrayBuffer,
  urlSafe = false
) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  if (urlSafe) {
    return btoa(binary)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }
  return btoa(binary)
}
