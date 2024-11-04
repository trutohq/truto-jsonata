function decodeHtmlEntities(encodedString: string) {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x5C;': '\\',
    '&#x60;': '`',
    '&#x3D;': '=',
  }

  return encodedString.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;|&#x5C;|&#x60;|&#x3D;/g,
    match => htmlEntities[match]
  )
}

export default decodeHtmlEntities
