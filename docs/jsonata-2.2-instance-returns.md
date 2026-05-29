# JSONata 2.2 — custom function return types

JSONata 2.2 blocks access to prototype properties/methods on values returned from expressions. Every custom function that returns a native object (`URL`, Luxon `DateTime`, `Blob`, `ArrayBuffer`, `ReadableStream`, `DepGraph`, …) uses a **jsonata-safe wrapper** with own properties and bound methods.

Internal consumers (`$getArrayBuffer`, `$getDataUri`, `$bufferToString`, `$parseDocument`) call `unwrapNative()` so wrapped values still work when passed between functions in the same expression.

## Wrapped functions

| Function | Wrapper | JSONata-accessible surface |
|----------|---------|---------------------------|
| `$dtFromIso` / `$dtFromFormat` | `toJsonataDateTime` | `year`, `month`, …, `toISO`, `toFormat`, `plus`, `minus`, `startOf`, `endOf`, `diff`, … |
| `$parseUrl` | `toJsonataUrl` | `origin`, `pathname`, `search`, `searchParams.get`, … |
| `$blob` / `$base64ToBlob` / `$convertMdToPdf` | `toJsonataBlob` | `size`, `type`, `name`, `arrayBuffer`, `text`, `slice`, `stream` |
| `$jsonToParquet` | `toJsonataArrayBuffer` | `byteLength`, `slice` |
| `$teeStream` | `toJsonataReadableStream` (×2) | `locked`, `cancel`, `tee`, `getReader` |
| `$dependencyGraph` | `toJsonataDepGraph` | `overallOrder`, `dependenciesOf`, `dependantsOf`, `hasNode`, `getNodeData`, `clone` |

## Plain JSON / primitives (no wrapper)

`$parseQuery`, `$xmlToJs`, `$jsonParse`, `$sortNodes`, converters that return strings, `$digest`, `$sign`, `$uuid`, lodash helpers, etc.

## Tests

```bash
yarn vitest run src/__tests__/instanceReturnAudit.test.ts
yarn vitest run src/__tests__/jsonata22Prototype.compat.test.ts
```
