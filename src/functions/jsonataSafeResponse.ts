/**
 * Plain read-only mirror of a fetch Response for JSONata inputs — JSONata 2.2
 * can't read a live Response's prototype getters. Headers flatten to a plain
 * object; no body methods and no round-trip (the body is already consumed).
 */
function jsonataSafeResponse(response: Response) {
  // structural cast: the DOM and Workers Response types declare `.type` differently
  const r = response as unknown as {
    status: number
    statusText: string
    ok: boolean
    redirected: boolean
    type: string
    bodyUsed: boolean
    url: string
    headers: { entries(): Iterable<[string, string]> }
  }
  return {
    status: r.status,
    statusText: r.statusText,
    ok: r.ok,
    redirected: r.redirected,
    type: r.type,
    bodyUsed: r.bodyUsed,
    url: r.url,
    headers: Object.fromEntries(r.headers.entries()),
  }
}

export default jsonataSafeResponse
