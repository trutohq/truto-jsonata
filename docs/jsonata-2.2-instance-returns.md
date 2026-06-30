# JSONata 2.2 — custom function return types

JSONata 2.2 blocks access to prototype properties/methods on values returned from expressions. Every custom function that returns a native object (`URL`, Luxon `DateTime`, `Blob`, `ArrayBuffer`, `ReadableStream`, `DepGraph`, …) uses a **jsonata-safe wrapper** with own properties and bound methods.

Internal consumers (`$getArrayBuffer`, `$getDataUri`, `$bufferToString`, `$parseDocument`) call `unwrapNative()` so wrapped values still work when passed between functions in the same expression.

The native instance is stored under a **non-enumerable** `Symbol`, so it never appears in `$keys`/`$spread` or JSON output. The `DateTime`, `Duration`, and `URL` wrappers also define a **non-enumerable `toJSON`** so returning the value directly still serializes the way the native object did (ISO string / href) — preserving backwards compatibility with mappings that emit the value without chaining a method.

## Wrapped functions

| Function | Wrapper | JSONata-accessible surface |
|----------|---------|---------------------------|
| `$dtFromIso` / `$dtFromFormat` | `toJsonataDateTime` | All Luxon scalar getters (`year`, `month`, `day`, `weekday`, `quarter`, `ordinal`, `weekNumber`, `offset`, `zoneName`, `zone`, `isValid`, …) and methods (`toISO`, `toISODate`, `toISOTime`, `toFormat`, `toRFC2822`, `toHTTP`, `toMillis`, `toSeconds`, `toUnixInteger`, `toJSDate`, `plus`, `minus`, `set`, `startOf`, `endOf`, `setZone`, `diff`, `equals`, `hasSame`, …). `diff`/`diffNow` return a wrapped `Duration` (`as`, `toMillis`, `toFormat`, `shiftTo`, `toObject`, …). |
| `$parseUrl` | `toJsonataUrl` | `href`, `origin`, `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, `hash`, `toString()`, and `searchParams.{get,has,getAll,keys,values,entries,size,toString}` |
| `$blob` / `$base64ToBlob` / `$convertMdToPdf` | `toJsonataBlob` | `size`, `type`, `name`, `arrayBuffer`, `text`, `slice`, `stream` |
| `$jsonToParquet` | `toJsonataArrayBuffer` | `byteLength`, `slice` |
| `$teeStream` | `toJsonataReadableStream` (×2) | `locked`, `cancel`, `tee`, `getReader` |
| `$dependencyGraph` | `toJsonataDepGraph` | `overallOrder`, `dependenciesOf`, `dependantsOf`, `hasNode`, `getNodeData`, `clone` |

> **Breaking change (v3.0.0):** these functions return plain wrapper objects instead of native instances. Field/method access in JSONata is preserved (and broadened), but JS callers can no longer rely on `instanceof URL` / `DateTime` — use `unwrapNative()` (or the typed `unwrapUrl`/`unwrapDateTime`/… helpers).

## Plain JSON / primitives (no wrapper)

`$parseQuery`, `$xmlToJs`, `$jsonParse`, `$sortNodes`, converters that return strings, `$digest`, `$sign`, `$uuid`, lodash helpers, etc.

## Tests

```bash
yarn vitest run src/__tests__/instanceReturnAudit.test.ts
yarn vitest run src/__tests__/jsonata22Prototype.compat.test.ts
yarn vitest run src/functions/__tests__/toJsonataWrappers.unit.test.ts
yarn vitest run src/__tests__/jsonataWrappers.compat.test.ts
# Regression net over vendored production mapping snippets (runs in CI):
yarn vitest run src/__tests__/unifiedMappingDatetime.scan.test.ts
yarn vitest run src/__tests__/unifiedMappingParseUrl.scan.test.ts
```
