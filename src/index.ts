import jsonata, { Expression } from 'jsonata'
import registerJsonataExtensions from './registerJsonataExtensions'

export default function trutoJsonata(expression: string): Expression {
  return registerJsonataExtensions(jsonata(expression))
}

// Native values returned by custom functions (ArrayBuffer, Blob, ReadableStream,
// DepGraph, luxon DateTime, URL) are boxed in JSONata-safe wrappers so they
// survive JSONata 2.2 evaluation. Consumers that need the real native value
// back — e.g. the Truto worker uploading `$jsonToParquet(...)` bytes to S3/GCS —
// must unwrap the evaluation result with these helpers.
export {
  unwrapNative,
  unwrapArrayBuffer,
  unwrapBlob,
  unwrapReadableStream,
  unwrapDepGraph,
  unwrapDateTime,
  unwrapUrl,
} from './functions/unwrapNative'

// Inverse direction: hosts that pass a native URL *into* an evaluation input
// need the same JSONata-safe shape $parseUrl produces (JSONata 2.2+ cannot
// read prototype getters, so a raw URL instance is opaque to expressions).
export { toJsonataUrl } from './functions/parseUrl'
