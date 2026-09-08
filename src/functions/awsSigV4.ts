import { AwsClient } from 'aws4fetch'

type AwsCredentials = {
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
}

const requiredCredential = (credentials: AwsCredentials, key: string) => {
  const value = (credentials as Record<string, unknown>)[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `awsSigV4 requires credentials.${key} to be a non-empty string`
    )
  }
  return value
}

/**
 * Signs a request with AWS Signature Version 4 and returns the headers to send.
 *
 * The returned object is a plain object (not a Headers instance, which does not
 * survive jsonata's $merge) holding every header of the signed request: the ones
 * the caller passed in plus the ones SigV4 adds (Authorization, X-Amz-Date and,
 * when a session token is used, X-Amz-Security-Token). Callers should $merge it
 * over their existing headers.
 */
const awsSigV4 = async (
  method: string,
  url: string,
  headers: Record<string, string> | undefined,
  body: string | undefined,
  credentials: AwsCredentials,
  service: string,
  region: string
): Promise<Record<string, string>> => {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('awsSigV4 requires a non-empty url string')
  }

  if (
    headers != null &&
    (typeof headers !== 'object' || Array.isArray(headers))
  ) {
    throw new Error(
      `awsSigV4 headers must be an object of header name to value, received ${typeof headers}`
    )
  }

  // aws4fetch can only hash a string, ArrayBuffer or ArrayBufferView body unless
  // the caller pre-computes X-Amz-Content-Sha256, which this flat signature has
  // no room for. Serialise the body before calling, e.g. $string(payload).
  if (body != null && typeof body !== 'string') {
    throw new Error(
      `awsSigV4 body must be a string, received ${
        Array.isArray(body) ? 'array' : typeof body
      }. Serialise it first, e.g. $string(body)`
    )
  }

  if (
    credentials == null ||
    typeof credentials !== 'object' ||
    Array.isArray(credentials)
  ) {
    throw new Error(
      'awsSigV4 requires a credentials object with accessKeyId and secretAccessKey'
    )
  }

  const accessKeyId = requiredCredential(credentials, 'accessKeyId')
  const secretAccessKey = requiredCredential(credentials, 'secretAccessKey')
  const { sessionToken } = credentials
  if (sessionToken != null && typeof sessionToken !== 'string') {
    throw new Error(
      'awsSigV4 requires credentials.sessionToken to be a string when provided'
    )
  }

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    service,
    region,
  })

  let signed: Request
  try {
    signed = await client.sign(url, {
      method,
      headers: headers ?? {},
      body,
    })
  } catch (e: any) {
    throw new Error(`awsSigV4 signing failed. Underlying: ${e?.message || e}`)
  }

  const signedHeaders = Object.fromEntries(signed.headers) as Record<
    string,
    string
  >

  // The Request constructor defaults Content-Type to text/plain for a string
  // body. That header is never part of a SigV4 signature, so returning it would
  // silently mislabel the caller's payload.
  const callerSetContentType = Object.keys(headers ?? {}).some(
    name => name.toLowerCase() === 'content-type'
  )
  if (!callerSetContentType) {
    delete signedHeaders['content-type']
  }

  return signedHeaders
}

export default awsSigV4
