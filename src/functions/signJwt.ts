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

      // Environment-specific key import
      const processObj = (globalThis as any).process
      const isNode =
        typeof processObj !== 'undefined' && !!processObj?.versions?.node

      if (isNode) {
        // Node.js environment
        signingKey = await importPKCS8(pemKey, alg)
      } else {
        // Browser/Worker environment - use Web Crypto API directly
        const keyData = pemKey
          .replace(/-----BEGIN PRIVATE KEY-----/, '')
          .replace(/-----END PRIVATE KEY-----/, '')
          .replace(/\s/g, '')

        const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))

        const algorithm = {
          name: alg.startsWith('RS')
            ? 'RSASSA-PKCS1-v1_5'
            : alg.startsWith('PS')
            ? 'RSA-PSS'
            : 'ECDSA',
          hash: alg.includes('256')
            ? 'SHA-256'
            : alg.includes('384')
            ? 'SHA-384'
            : 'SHA-512',
        }

        signingKey = await crypto.subtle.importKey(
          'pkcs8',
          binaryKey,
          algorithm,
          false,
          ['sign']
        )
      }
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
