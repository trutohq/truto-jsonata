// JSONata 2.0 turned every number into text with 15 significant digits, so
// `1234567890123456 & ""` gave "1234567890123460". JSONata 2.2 keeps every
// digit of a whole number. Expressions written for 2.0 rely on the old text,
// so every build of this library patches the bundled jsonata back to it.
// This is deliberate 2.0 parity: do not "fix" the lost digits here.
//
// The one place it lives is jsonata's `string()` (used by `&`, `$string` and
// the `$clone` copy that the transform operator makes).

export const JSONATA_FILE = /[\\/]node_modules[\\/]jsonata[\\/]jsonata\.js$/

const JSONATA_22 =
  'return val.toPrecision && !Number.isInteger(val) ? Number(val.toPrecision(15)) : val;'
const JSONATA_20 = 'return val.toPrecision ? Number(val.toPrecision(15)) : val;'

export function patchJsonata(source: string): string {
  const parts = source.split(JSONATA_22)
  if (parts.length !== 2) {
    // A jsonata upgrade moved the line: find it again before shipping.
    throw new Error(
      `jsonata number text patch: expected 1 match in jsonata.js, found ${parts.length - 1}`
    )
  }
  return parts.join(JSONATA_20)
}
