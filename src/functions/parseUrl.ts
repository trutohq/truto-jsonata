import { NATIVE_URL } from './unwrapNative'

/** Plain object with own properties so JSONata 2.2+ can access URL fields and searchParams. */
export function toJsonataUrl(url: URL) {
  const params = url.searchParams
  const value = {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    hash: url.hash,
    search: url.search,
    searchParams: {
      get: (name: string) => params.get(name),
      has: (name: string) => params.has(name),
      getAll: (name: string) => params.getAll(name),
      keys: () => [...params.keys()],
      values: () => [...params.values()],
      entries: () => [...params.entries()],
      size: params.size,
      toString: () => params.toString(),
    },
  }
  // Non-enumerable so $keys stays clean, but explicit `.toString()` / JSON
  // serialization still behave like the native URL (which returns href).
  Object.defineProperty(value, 'toString', {
    value: () => url.href,
    enumerable: false,
  })
  Object.defineProperty(value, 'toJSON', {
    value: () => url.href,
    enumerable: false,
  })
  Object.defineProperty(value, NATIVE_URL, { value: url, enumerable: false })
  return value
}

function parseUrl(url: string) {
  return toJsonataUrl(new URL(url))
}

export default parseUrl
