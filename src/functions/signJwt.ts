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
  options?: any
): Promise<string> => {
  assertObjectPayload(payload)

  try {
    const alg = (options && options.algorithm) || 'HS256'
    const secret =
      typeof secretOrPrivateKey === 'string'
        ? new TextEncoder().encode(secretOrPrivateKey)
        : (secretOrPrivateKey as Uint8Array)

    const jwtBuilder = new SignJWT(
      payload as Record<string, any>
    ).setProtectedHeader({ alg, typ: 'JWT', ...(options && options.header) })

    if (options?.expiresIn) {
      jwtBuilder.setExpirationTime(options.expiresIn)
    }
    if (options?.notBefore) {
      jwtBuilder.setNotBefore(options.notBefore)
    }
    if ((payload as any).iat === undefined && !options?.noTimestamp) {
      jwtBuilder.setIssuedAt()
    }

    return await jwtBuilder.sign(secret)
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
