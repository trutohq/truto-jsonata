import jsonwebtoken from 'jsonwebtoken'

function assertObjectPayload(payload: unknown): asserts payload is object {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error('Payload must be a non-null object')
  }
}

const signJwt = async (config: {
  payload: unknown
  secretOrPrivateKey: unknown
  options?: any
}): Promise<string> => {
  const { payload, secretOrPrivateKey, options } = config
  assertObjectPayload(payload)

  try {
    return jsonwebtoken.sign(
      payload as Record<string, any>,
      secretOrPrivateKey as any,
      options
    )
  } catch (error: any) {
    throw new Error(`JWT signing failed: ${error?.message || String(error)}`)
  }
}

export default signJwt
