import { NATIVE_DATE } from './unwrapNative'

/**
 * Plain object with own-property Date methods so JSONata 2.2 can call
 * `started_at.toISOString()` (prototype methods are invisible under 2.2).
 * Round-trips back to a real `Date` via {@link NATIVE_DATE} on unwrap.
 *
 * Distinct from Luxon `$dtFromIso` wrappers — this is for host-passed
 * `new Date()` values (e.g. `sync_job_run.started_at`).
 */
export function toJsonataDate(date: Date) {
  const value: Record<string, unknown> = {
    toISOString: () => date.toISOString(),
    getTime: () => date.getTime(),
    getFullYear: () => date.getFullYear(),
    getMonth: () => date.getMonth(),
    getDate: () => date.getDate(),
    getUTCFullYear: () => date.getUTCFullYear(),
    getUTCMonth: () => date.getUTCMonth(),
    getUTCDate: () => date.getUTCDate(),
    getUTCHours: () => date.getUTCHours(),
    getUTCMinutes: () => date.getUTCMinutes(),
    getUTCSeconds: () => date.getUTCSeconds(),
    getUTCMilliseconds: () => date.getUTCMilliseconds(),
  }

  Object.defineProperty(value, 'toString', {
    value: () => date.toISOString(),
    enumerable: false,
  })
  Object.defineProperty(value, 'toJSON', {
    value: () => date.toISOString(),
    enumerable: false,
  })
  Object.defineProperty(value, 'valueOf', {
    value: () => date.getTime(),
    enumerable: false,
  })
  Object.defineProperty(value, NATIVE_DATE, {
    value: date,
    enumerable: false,
  })

  return value
}
