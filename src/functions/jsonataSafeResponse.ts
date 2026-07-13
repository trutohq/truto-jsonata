import { toJsonataArrayBuffer } from './toJsonataArrayBuffer'
import { toJsonataBlob } from './toJsonataBlob'
import { toJsonataReadableStream } from './toJsonataReadableStream'
import { NATIVE_HEADERS, NATIVE_RESPONSE } from './unwrapNative'

function jsonataSafeHeaders(headers: Headers) {
  const value: Record<string, unknown> = {}
  for (const [name, headerValue] of headers.entries()) {
    Object.defineProperty(value, name, {
      value: headerValue,
      configurable: true,
    })
  }
  Object.defineProperties(value, {
    get: { value: (name: string) => headers.get(name) },
    has: { value: (name: string) => headers.has(name) },
    entries: { value: () => [...headers.entries()] },
    keys: { value: () => [...headers.keys()] },
    values: { value: () => [...headers.values()] },
    [NATIVE_HEADERS]: { value: headers },
  })
  return value
}

/**
 * Read-only mirror of a fetch Response for JSONata inputs. Prototype-backed
 * fields/methods become own properties, while a hidden native pointer restores
 * the original Response when it leaves evaluate().
 */
function jsonataSafeResponse(response: Response) {
  // structural cast: the DOM and Workers Response types declare `.type` differently
  const r = response as unknown as {
    status: number
    statusText: string
    ok: boolean
    redirected: boolean
    type: string
    url: string
  }
  const value = {
    status: r.status,
    statusText: r.statusText,
    ok: r.ok,
    redirected: r.redirected,
    type: r.type,
    url: r.url,
    headers: jsonataSafeHeaders(response.headers),
    body: response.body ? toJsonataReadableStream(response.body) : null,
    arrayBuffer: async () => toJsonataArrayBuffer(await response.arrayBuffer()),
    blob: async () => toJsonataBlob(await response.blob()),
    clone: () => jsonataSafeResponse(response.clone()),
    json: () => response.json(),
    text: () => response.text(),
  }
  Object.defineProperty(value, 'bodyUsed', {
    get: () => response.bodyUsed,
    enumerable: true,
  })
  Object.defineProperty(value, NATIVE_RESPONSE, {
    value: response,
    enumerable: false,
  })
  return value
}

export default jsonataSafeResponse
