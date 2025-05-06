function base64decode(base64: string, urlSafe = false): string {
  if (urlSafe) {
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/')
  }
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

export default base64decode
