import { SignJWT, importPKCS8 } from 'jose'
import { isPlainObject, isNull, isString, includes, replace } from 'lodash-es'

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
    let signingKey: Uint8Array | CryptoKey

    const alg = protectHeaders.alg
    if (!alg) {
      throw new Error('Algorithm (alg) must be provided in protectHeaders')
    }

    const isAsymmetric =
      alg.startsWith('RS') || alg.startsWith('ES') || alg.startsWith('PS')

    if (isAsymmetric) {
      if (!isString(key)) {
        throw new Error('For asymmetric algorithms, key must be a PEM string')
      }
      const pemKey = includes(key, '\\n') ? replace(key, /\\n/g, '\n') : key
      signingKey = await importPKCS8(pemKey, alg)
    } else {
      signingKey = isString(key)
        ? new TextEncoder().encode(key)
        : (key as Uint8Array)
    }

    const jwtBuilder = new SignJWT(
      payload as Record<string, any>
    ).setProtectedHeader({ ...protectHeaders, typ: 'JWT' } as any)

    return await jwtBuilder.sign(signingKey, signOptions)
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
