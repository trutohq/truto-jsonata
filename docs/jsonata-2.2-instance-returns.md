# JSONata 2.2 — custom function return types

JSONata 2.2 blocks access to prototype properties/methods on values returned from expressions. Custom functions must return **plain objects with own properties** when mappings chain field access (e.g. `$fn().field`, `$fn().method()`).

## Fixed (used in unified mappings)

| Function | Was | Now |
|----------|-----|-----|
| `$dtFromIso` / `$dtFromFormat` | Luxon `DateTime` | `toJsonataDateTime()` plain object + bound Luxon methods |
| `$parseUrl` | `URL` | `toJsonataUrl()` with `origin`, `pathname`, `searchParams.get`, etc. |

## Safe without wrapping (production usage)

Returned as opaque values or plain JSON; **no** chained JSONata access in unified models / sync jobs:

| Function | Returns | Notes |
|----------|---------|--------|
| `$blob` / `$base64ToBlob` | `Blob` | Passed to HTTP body or nested into `$getDataUri` / `$getArrayBuffer` in JS |
| `$jsonToParquet` | `ArrayBuffer` | Assigned to `parquet` field only |
| `$getArrayBuffer` | `ArrayBuffer` | Request body mapping |
| `$convertMdToPdf` | `Blob` | Only nested in `$getDataUri(...)` |
| `$parseDocument` | `string` | API content |
| `$parseQuery` | plain object | `qs.parse` — own keys work in JSONata |
| `$xmlToJs` / `$jsonParse` | plain object | |
| `$stringifyQuery` | `string` | |
| `$sortNodes` | plain array of objects | |
| Markdown/HTML/Notion converters | `string` or plain arrays | |
| `$generateEmbeddingsCohere` | plain JSON | |
| `$digest` / `$sign` / `$uuid` / … | primitives | |

## Not used in unified mappings (wrap if chaining is added later)

| Function | Returns | Risk if chained in JSONata |
|----------|---------|------------------------------|
| `$dependencyGraph` | `DepGraph` | Method calls throw `T1006` |
| `$teeStream` | `[ReadableStream, ReadableStream]` | Indexing may work; stream methods would not |

## Regenerating compatibility tests

```bash
yarn vitest run src/__tests__/instanceReturnAudit.test.ts
yarn vitest run src/__tests__/jsonata22Prototype.compat.test.ts
# Optional: local truto checkout scan
yarn vitest run src/__tests__/unifiedMappingDatetime.scan.test.ts
```
