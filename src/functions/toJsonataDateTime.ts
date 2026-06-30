import { DateTime, Duration } from 'luxon'
import { NATIVE_LUXON_DATE_TIME, unwrapNative } from './unwrapNative'

/** Scalar Luxon getters copied as own-enumerable properties for JSONata 2.2+. */
const DATETIME_GETTERS = [
  'year',
  'quarter',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'weekYear',
  'weekNumber',
  'weekday',
  'ordinal',
  'monthShort',
  'monthLong',
  'weekdayShort',
  'weekdayLong',
  'offset',
  'offsetNameShort',
  'offsetNameLong',
  'zoneName',
  'daysInMonth',
  'daysInYear',
  'weeksInWeekYear',
  'isInLeapYear',
  'isInDST',
  'isOffsetFixed',
  'isValid',
  'invalidReason',
  'invalidExplanation',
  'locale',
  'numberingSystem',
  'outputCalendar',
] as const

const DATETIME_METHODS = [
  'plus',
  'minus',
  'set',
  'startOf',
  'endOf',
  'setZone',
  'setLocale',
  'reconfigure',
  'toUTC',
  'toLocal',
  'toFormat',
  'toISO',
  'toISODate',
  'toISOTime',
  'toISOWeekDate',
  'toRFC2822',
  'toHTTP',
  'toSQL',
  'toSQLDate',
  'toSQLTime',
  'toJSDate',
  'toMillis',
  'toSeconds',
  'toUnixInteger',
  'toRelative',
  'toRelativeCalendar',
  'toLocaleString',
  'diff',
  'diffNow',
  'until',
  'hasSame',
  'equals',
  'valueOf',
] as const

const DURATION_METHODS = [
  'as',
  'plus',
  'minus',
  'shiftTo',
  'normalize',
  'negate',
  'toFormat',
  'toISO',
  'toMillis',
  'get',
] as const

function wrapDuration(duration: Duration) {
  const value: Record<string, unknown> = { ...duration.toObject() }
  value.toObject = () => ({ ...duration.toObject() })
  for (const method of DURATION_METHODS) {
    const fn = (
      duration[method as keyof Duration] as (...a: unknown[]) => unknown
    ).bind(duration)
    value[method] = (...args: unknown[]) => {
      const result = fn(...args)
      return Duration.isDuration(result) ? wrapDuration(result) : result
    }
  }
  Object.defineProperty(value, 'toJSON', {
    value: () => duration.toISO(),
    enumerable: false,
  })
  return value
}

function bindDateTimeMethod(dt: DateTime, method: (typeof DATETIME_METHODS)[number]) {
  const fn = (dt[method as keyof DateTime] as (...args: unknown[]) => unknown).bind(
    dt
  )
  return (...args: unknown[]) => {
    const result = fn(...args.map(unwrapNative))
    if (DateTime.isDateTime(result)) {
      return toJsonataDateTime(result)
    }
    if (Duration.isDuration(result)) {
      return wrapDuration(result)
    }
    return result
  }
}

/** Plain object with own properties/methods for JSONata 2.2+ (no prototype getter access). */
export function toJsonataDateTime(dt: DateTime) {
  const value: Record<string, unknown> = {}

  for (const getter of DATETIME_GETTERS) {
    value[getter] = dt[getter as keyof DateTime]
  }
  // Backwards-compatible alias: earlier wrappers exposed `zone` as the zone name string.
  value.zone = dt.zoneName

  for (const method of DATETIME_METHODS) {
    value[method] = bindDateTimeMethod(dt, method)
  }

  // Preserve legacy serialization: returning the date directly should still
  // JSON-stringify to an ISO string (Luxon's native toJSON behaviour).
  Object.defineProperty(value, 'toJSON', {
    value: () => dt.toISO(),
    enumerable: false,
  })

  Object.defineProperty(value, NATIVE_LUXON_DATE_TIME, {
    value: dt,
    enumerable: false,
  })

  return value
}
