import mime from 'mime'

function getMimeType(extensionType: string) {
  try {
    return mime.getType(extensionType)
  } catch (e) {
    return null
  }
}

export default getMimeType
