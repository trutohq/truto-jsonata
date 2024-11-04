import { encodeBase64 } from 'hono/utils/encode'

function base64encode(arg: string) {
  return encodeBase64(new TextEncoder().encode(arg))
}
export default base64encode
