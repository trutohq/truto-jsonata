import { encodeBase64 } from 'hono/utils/encode'

function encodebase64(arg: string) {
  return encodeBase64(new TextEncoder().encode(arg))
}
export default encodebase64
