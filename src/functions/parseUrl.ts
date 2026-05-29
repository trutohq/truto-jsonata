export type JsonataUrl = ReturnType<typeof toJsonataUrl>

/** Plain object with own properties so JSONata 2.2+ can access URL fields and searchParams. */
export function toJsonataUrl(url: URL) {
  const params = url.searchParams
  return {
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
    },
  }
}

function parseUrl(url: string) {
  return toJsonataUrl(new URL(url))
}

export default parseUrl
