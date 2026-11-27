import jsonata from 'jsonata'

type NativeFunction = {
  implementation: (this: unknown, ...args: unknown[]) => unknown
}

// JSONata 2.0's $toMillis took text such as '2024-01-15-16' (its ISO 8601
// check let the date parts repeat) and returned NaN. JSONata 2.2 throws D3110.
// This pattern accepts exactly the text 2.0's did, but it cannot backtrack:
// 2.0's own pattern is the $toMillis DoS that 2.1 fixed. Do not copy it back.
const ISO8601_20 =
  /^\d{4}(?:-[0-3]\d)*(?:T[0-2]\d:[0-5]\d:[0-5]\d)*(?:\.\d+)?(?:[+-][0-2]\d:?[0-5]\d|Z)?$/

let builtin: NativeFunction | undefined

/** `$toMillis` as JSONata 2.0 had it. */
export default async function toMillis20(
  this: unknown,
  timestamp?: string,
  picture?: string
) {
  if (
    picture === undefined &&
    typeof timestamp === 'string' &&
    ISO8601_20.test(timestamp)
  ) {
    return Date.parse(timestamp)
  }
  builtin ??= (await jsonata('$toMillis').evaluate({})) as NativeFunction
  return builtin.implementation.call(this, timestamp, picture)
}
