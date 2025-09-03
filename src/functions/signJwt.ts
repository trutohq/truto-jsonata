import { SignJWT } from 'jose'
import { isPlainObject, isNull, isString } from 'lodash-es'

function assertObjectPayload(payload: unknown): asserts payload is object {
  if (!isPlainObject(payload) || isNull(payload)) {
    throw new Error('Payload must be a non-null object')
  }
}

const signJwt = async (
  payload: unknown,
  key: unknown,
  signOptions: any,
  protectHeaders?: Record<string, any>
): Promise<string> => {
  assertObjectPayload(payload)

  try {
    const secret = isString(key)
      ? new TextEncoder().encode(key)
      : (key as Uint8Array)

    const jwtBuilder = new SignJWT(
      payload as Record<string, any>
    ).setProtectedHeader({ alg: 'HS256', typ: 'JWT', ...protectHeaders })

    return await jwtBuilder.sign(secret, signOptions)
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
