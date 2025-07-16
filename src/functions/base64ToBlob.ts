type Base64ToBlobOptions = {
  mimeType?: string
  urlSafe?: boolean
}

function base64ToBlob(base64: string, options: Base64ToBlobOptions = {}): Blob {
  const { mimeType = 'application/octet-stream', urlSafe = false } = options

  if (!base64 || typeof base64 !== 'string') {
    return new Blob([], { type: mimeType })
  }

  let cleanBase64 = base64.trim()
  let detectedMimeType = mimeType

  // Handle data URI format: data:mime/type;base64,encodeddata
  if (cleanBase64.startsWith('data:')) {
    const dataUriMatch = cleanBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (dataUriMatch) {
      detectedMimeType = dataUriMatch[1] || mimeType
      cleanBase64 = dataUriMatch[2]
    } else {
      throw new Error('Invalid data URI format')
    }
  }

  // Handle URL-safe base64
  if (urlSafe) {
    cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/')
  }

  // Add padding if needed
  while (cleanBase64.length % 4) {
    cleanBase64 += '='
  }

  try {
    // Decode base64 to binary string
    const binaryString = atob(cleanBase64)

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return new Blob([bytes], { type: detectedMimeType })
  } catch (error) {
    throw new Error(
      `Invalid base64 string: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

export default base64ToBlob
