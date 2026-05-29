import { DateTime } from 'luxon'

export type JsonataDateTime = ReturnType<typeof toJsonataDateTime>

/** Plain object with own properties so JSONata 2.2+ can access fields like `.year`. */
export function toJsonataDateTime(dt: DateTime) {
  return {
    ...dt.toObject(),
    zone: dt.zoneName,
    isValid: dt.isValid,
    toISO: () => dt.toISO(),
    toMillis: () => dt.toMillis(),
    toUTC: () => toJsonataDateTime(dt.toUTC()),
    setZone: (zone: string) => toJsonataDateTime(dt.setZone(zone)),
  }
}
