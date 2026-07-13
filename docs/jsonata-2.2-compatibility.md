# JSONata 2.0.6 → 2.2.1 compatibility

`truto-jsonata` 2.0.1 used JSONata 2.0.6. Version 2.0.2 adopted JSONata 2.2.1;
3.x retained it and added compatibility wrappers/boundaries. This matrix records
every upstream changelog item that can affect expressions or the JavaScript
host boundary.

| Upstream change                                    | Compatibility treatment                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 2.1 awaits values in array constructors            | Keep upstream fix. Previously successful synchronous arrays remain covered by the 2.0.1 differential suite.     |
| New `?:` and `??` operators                        | Additive; existing ternary expressions are unchanged.                                                           |
| Date-time parser and ISO-8601 fixes                | Keep upstream fixes. `$toMillis` and production date patterns are covered.                                      |
| `$pad` truncates fractional widths                 | Keep upstream fix. Integer-width behavior is checked against 2.0.1; fractional widths previously threw.         |
| Repeating function-signature fix                   | Keep upstream fix. Existing repeating-argument calls are checked with `$zip`.                                   |
| `$string` numeric precision change                 | Override `$string` with 2.0.6 formatting and error behavior, including nested values and native wrappers.       |
| `$formatNumber` / `$formatBase` fixes              | Keep upstream fixes; previously successful formatting, including large integer bases, is checked against 2.0.1. |
| `$lookup` blocks prototype members                 | Keep the security boundary. Legitimate Truto native inputs/returns are mirrored with safe own properties.       |
| Resource guardrail API                             | Additive host API; no expression change.                                                                        |
| Prototype-pollution prevention / own-key iteration | Keep inside JSONata. Convert null-prototype expression results back to ordinary host objects after evaluation.  |
| Wildcards no longer unwrap function objects        | Keep the security fix. Ordinary wildcard behavior is checked against 2.0.1.                                     |
| `$append` enforces sequence guardrails             | Keep the resource limit. Ordinary `$append` behavior is checked against 2.0.1.                                  |
| `_jsonata_*` internal object flags are reserved    | Keep the security fix.                                                                                          |

## Truto host boundary

The default entrypoint mirrors the native values present in Truto expression
contexts: `URL`, `Response`, `Blob`, `File`, `ArrayBuffer`, typed arrays,
`DataView`, `Date`, and `ReadableStream`. Typed arrays and `DataView` are
cloned before stamping so host instances are not permanently decorated. Host
Luxon `DateTime` values and native values returned by custom functions use
JSONata-readable wrappers that are unwrapped before returning to the host.

Traversal and result unwrapping are cycle-safe. Frozen/sealed values use a safe
wrapper or same-native-type clone when own properties cannot be stamped.

## Regression gate

`src/__tests__/legacy201Compatibility.test.ts` evaluates the same successful
language, built-in, custom-function, native-boundary, serialization, and error
cases with both the published `@truto/truto-jsonata@2.0.1` package and the
current implementation.

The upstream security fixes are intentional exceptions: expressions that read
`constructor`, `__proto__`, `_jsonata_*`, or arbitrary inherited members remain
blocked. Production mapping/sync-job scans found no use of those patterns.
