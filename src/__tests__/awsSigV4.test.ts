import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import awsSigV4 from '../functions/awsSigV4'
import trutoJsonata from '../index'

const credentials = {
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
}

describe('awsSigV4', async () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should return a deterministic SigV4 Authorization header', async () => {
    const headers = await awsSigV4(
      'GET',
      'https://example.execute-api.us-east-1.amazonaws.com/prod/items?limit=10',
      {},
      undefined,
      credentials,
      'execute-api',
      'us-east-1'
    )
    expect(headers.authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20240101/us-east-1/execute-api/aws4_request, SignedHeaders=host;x-amz-date, Signature=47bd1784d76c51c94cc943aecc1ff9e3b823528e5fec30eee027aeaa5928822c'
    )
    expect(
      headers.authorization.startsWith('AWS4-HMAC-SHA256 Credential=')
    ).toBe(true)
    expect(headers['x-amz-date']).toBe('20240101T000000Z')
  })

  it('should return a plain object, not a Headers instance', async () => {
    const headers = await awsSigV4(
      'GET',
      'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
      {},
      undefined,
      credentials,
      'execute-api',
      'us-east-1'
    )
    expect(headers).toBeInstanceOf(Object)
    expect(headers).not.toBeInstanceOf(Headers)
    expect({ accept: 'application/json', ...headers }).toEqual({
      accept: 'application/json',
      authorization: expect.stringContaining('AWS4-HMAC-SHA256'),
      'x-amz-date': '20240101T000000Z',
    })
  })

  it('should add x-amz-security-token when a session token is supplied', async () => {
    const headers = await awsSigV4(
      'POST',
      'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
      { 'content-type': 'application/json' },
      '{"name":"widget"}',
      { ...credentials, sessionToken: 'SESSIONTOKEN' },
      'execute-api',
      'us-east-1'
    )
    expect(headers['x-amz-security-token']).toBe('SESSIONTOKEN')
    expect(headers.authorization).toContain('x-amz-security-token')
    expect(headers['content-type']).toBe('application/json')
  })

  it('should not invent a content-type the caller did not ask for', async () => {
    const headers = await awsSigV4(
      'POST',
      'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
      {},
      '{"name":"widget"}',
      credentials,
      'execute-api',
      'us-east-1'
    )
    expect(headers['content-type']).toBeUndefined()
  })

  it('should be callable from a jsonata expression and mergeable', async () => {
    const expr = trutoJsonata(
      `$merge([headers, $awsSigV4('GET', url, headers, body, credentials, 'execute-api', 'us-east-1')])`
    )
    const result = await expr.evaluate({
      url: 'https://example.execute-api.us-east-1.amazonaws.com/prod/items?limit=10',
      headers: { accept: 'application/json' },
      credentials,
    })
    expect(result).toEqual({
      accept: 'application/json',
      authorization:
        'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20240101/us-east-1/execute-api/aws4_request, SignedHeaders=accept;host;x-amz-date, Signature=962a7cb411a54f43fac811d6c0ff0ca106198f4d22bece7c8fc2191eb6040405',
      'x-amz-date': '20240101T000000Z',
    })
  })

  // JSONata 2.2 reads only own properties, boxes native returns and builds
  // expression objects with a null prototype, and trutoJsonata unwraps that on
  // the way out. The signed headers must survive that round trip as an ordinary
  // mergeable object, and a null-prototype headers argument built inside the
  // expression must still reach the signer.
  it('should survive the jsonata 2.2 native round trip as a mergeable plain object', async () => {
    const expr = trutoJsonata(
      `$merge([$awsSigV4('GET', url, {"accept": "application/json"}, undefined, credentials, 'execute-api', 'us-east-1'), {"accept": "application/json"}])`
    )
    const result = (await expr.evaluate({
      url: 'https://example.execute-api.us-east-1.amazonaws.com/prod/items?limit=10',
      credentials,
    })) as Record<string, string>

    // the expression-built (null-prototype) headers argument still got signed
    expect(result.authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20240101/us-east-1/execute-api/aws4_request, SignedHeaders=accept;host;x-amz-date, Signature=962a7cb411a54f43fac811d6c0ff0ca106198f4d22bece7c8fc2191eb6040405'
    )
    expect(result['x-amz-date']).toBe('20240101T000000Z')
    expect(result.accept).toBe('application/json')

    // ordinary host object with own enumerable string keys, not a null-prototype
    // object and not a wrapper, so hosts can clone and serialise it
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.keys(result).sort()).toEqual([
      'accept',
      'authorization',
      'x-amz-date',
    ])
    expect(() => structuredClone(result)).not.toThrow()
  })

  it('should stay readable by property access nested inside a result object', async () => {
    const expr = trutoJsonata(
      `{"method": "GET", "headers": $awsSigV4('GET', url, {}, undefined, credentials, 'execute-api', 'us-east-1')}`
    )
    const result = (await expr.evaluate({
      url: 'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
      credentials,
    })) as { method: string; headers: Record<string, string> }
    expect(result.method).toBe('GET')
    expect(result.headers.authorization).toContain('AWS4-HMAC-SHA256')
    expect(Object.getPrototypeOf(result.headers)).toBe(Object.prototype)
  })

  it('should throw a readable error for a non-string body', async () => {
    await expect(
      awsSigV4(
        'POST',
        'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
        {},
        { name: 'widget' } as any,
        credentials,
        'execute-api',
        'us-east-1'
      )
    ).rejects.toThrow(
      'awsSigV4 body must be a string, received object. Serialise it first, e.g. $string(body)'
    )
  })

  it('should throw a readable error for missing credentials', async () => {
    await expect(
      awsSigV4(
        'GET',
        'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
        {},
        undefined,
        {} as any,
        'execute-api',
        'us-east-1'
      )
    ).rejects.toThrow(
      'awsSigV4 requires credentials.accessKeyId to be a non-empty string'
    )

    await expect(
      awsSigV4(
        'GET',
        'https://example.execute-api.us-east-1.amazonaws.com/prod/items',
        {},
        undefined,
        undefined as any,
        'execute-api',
        'us-east-1'
      )
    ).rejects.toThrow(
      'awsSigV4 requires a credentials object with accessKeyId and secretAccessKey'
    )
  })
})
