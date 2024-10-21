import { decodeBase64 } from 'hono/utils/encode'

function decodebase64(arg: string) {
  return new TextDecoder('utf-8').decode(decodeBase64(arg))
}

export default decodebase64
