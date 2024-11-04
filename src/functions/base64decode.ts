import { decodeBase64 } from 'hono/utils/encode'

function base64decode(arg: string) {
  return new TextDecoder('utf-8').decode(decodeBase64(arg))
}

export default base64decode
