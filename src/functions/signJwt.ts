import { SignJWT } from 'jose'
import { isPlainObject, isNull, isArray } from 'lodash-es'

function assertObjectPayload(payload: unknown): asserts payload is object {
  if (!isPlainObject(payload) || isNull(payload) || isArray(payload)) {
    throw new Error('Payload must be a non-null object')
  }
}

const signJwt = async (
  payload: unknown,
  secretOrPrivateKey: unknown,
  headers?: Record<string, any>
): Promise<string> => {
  assertObjectPayload(payload)

  try {
    const secret =
      typeof secretOrPrivateKey === 'string'
        ? new TextEncoder().encode(secretOrPrivateKey)
        : (secretOrPrivateKey as Uint8Array)

    const jwtBuilder = new SignJWT(
      payload as Record<string, any>
    ).setProtectedHeader({ alg: 'HS256', typ: 'JWT', ...headers })

    return await jwtBuilder.sign(secret)
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
