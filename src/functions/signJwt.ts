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
  protectHeaders: Record<string, any> = {},
  signOptions?: any
): Promise<string> => {
  assertObjectPayload(payload)

  try {
    const secret = isString(key)
      ? new TextEncoder().encode(key)
      : (key as Uint8Array)

    if (!protectHeaders.alg) {
      throw new Error('Algorithm (alg) must be provided in protectHeaders')
    }

    const jwtBuilder = new SignJWT(
      payload as Record<string, any>
    ).setProtectedHeader({ ...protectHeaders, typ: 'JWT' } as any)

    return await jwtBuilder.sign(secret, signOptions)
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
