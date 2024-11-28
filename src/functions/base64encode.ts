function base64encode(input: string, urlSafe = false): string {
  let binary = ''
  const bytes: Uint8Array = new TextEncoder().encode(input)
  const len = bytes.length
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  let base64 = btoa(binary)
  if (urlSafe) {
    base64 = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  return base64
}

export default base64encode
