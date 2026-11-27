# JSONata 2.2 — custom function return types

JSONata 2.2 blocks access to prototype properties/methods on values returned from expressions. Every custom function that returns a native object (`URL`, Luxon `DateTime`, `Blob`, `ArrayBuffer`, `ReadableStream`, `DepGraph`, …) returns a **jsonata-safe wrapper** instead.

Internal consumers (`$getArrayBuffer`, `$getDataUri`, `$bufferToString`, `$parseDocument`) call `unwrapNative()` so wrapped values still work when passed between functions in the same expression. Other Truto functions get the native itself, as under JSONata 2.0.

Luxon values (`DateTime`, and the `Duration`, `Interval`, `Date`, zone and locale objects their members return), `Blob`, `ArrayBuffer` and `$parseUrl`'s `URL` use `toJsonataNative`: a Proxy that reads like the native did under JSONata 2.0. It lists only the native's own keys (so `$keys`, `.*`, `$each`, `$sift`, `$merge`, `=`, `$distinct`, `$string` and `? :` give the 2.0 result: a `DateTime` lists `ts`, `c`, `loc`, …; a `Blob` or `ArrayBuffer` serializes as `{}` and is false as a condition), and it also answers every member the native's prototype defines (getters and methods, not `Object.prototype`). Methods run on the native; objects they return are wrapped the same way. The same native always gives the same wrapper.

The other wrappers are plain objects with own properties and bound methods. The native instance is reachable through a **non-enumerable** `Symbol`, so it never appears in `$keys`/`$spread` or JSON output.

## Wrapped functions

| Function | Wrapper | JSONata-accessible surface |
|----------|---------|---------------------------|
| `$dtFromIso` / `$dtFromFormat` | `toJsonataDateTime` (`toJsonataNative`) | Every luxon `DateTime` member: own fields (`ts`, `c`, `o`, `loc`, …), getters (`year`, `zoneName`, `zone`, …) and methods (`toISO`, `toObject`, `toJSDate`, `plus`, `diff`, `until`, …). `diff` gives a `Duration`, `until` an `Interval`, `toJSDate` a `Date`, all wrapped the same way. |
| `$parseUrl` | `toJsonataNative` | Every `URL` member (`href`, `host`, `searchParams.get(…)`, …) |
| `$blob` / `$base64ToBlob` / `$convertMdToPdf` | `toJsonataBlob` (`toJsonataNative`) | Every `Blob` member (`size`, `type`, `arrayBuffer()`, `text()`, `slice()`, `stream()`, …) plus extra props such as `name`, set on the Blob itself |
| `$jsonToParquet` / `$getArrayBuffer` | `toJsonataArrayBuffer` (`toJsonataNative`) | Every `ArrayBuffer` member (`byteLength`, `slice()`, …) |
| `$teeStream` | `toJsonataReadableStream` (×2) | `locked`, `cancel`, `tee`, `getReader` |
| `$dependencyGraph` | `toJsonataDepGraph` | `overallOrder`, `dependenciesOf`, `dependantsOf`, `hasNode`, `getNodeData`, `clone` |

> **Breaking change (v3.0.0):** these functions return plain wrapper objects instead of native instances. Field/method access in JSONata is preserved (and broadened), but JS callers can no longer rely on `instanceof URL` / `DateTime` — use `unwrapNative()` (or the typed `unwrapUrl`/`unwrapDateTime`/… helpers).

## Plain JSON / primitives (no wrapper)

`$parseQuery`, `$xmlToJs`, `$jsonParse`, `$sortNodes`, converters that return strings, `$digest`, `$sign`, `$uuid`, lodash helpers, etc.

## Tests

Vendored JSON fixtures under `src/__tests__/fixtures/*-mapping-expressions.json` are extracted from production unified-model YAML and run in CI — no local truto checkout or YAML files required.

Refresh fixtures after mapping changes (local only):

```bash
bun run scripts/extractWrapperMappingSnippets.ts /path/to/unified-model/models
```

```bash
yarn vitest run src/__tests__/instanceReturnAudit.test.ts
yarn vitest run src/__tests__/jsonata22Prototype.compat.test.ts
yarn vitest run src/functions/__tests__/toJsonataWrappers.unit.test.ts
yarn vitest run src/__tests__/jsonataWrappers.compat.test.ts
yarn vitest run src/__tests__/unifiedMappingDatetime.scan.test.ts
yarn vitest run src/__tests__/unifiedMappingParseUrl.scan.test.ts
yarn vitest run src/__tests__/unifiedMappingInstanceReturns.scan.test.ts
```
