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

// JSONata 2.2 reads own properties only, so every getter and method must look
// like an own, enumerable property. Computing them all per wrap cost ~80us
// (zoneName and offsetName* go through Intl), and an expression wraps again
// at every call in a chain; even defining 66 lazy accessors per wrap cost
// ~8us. So a wrapper is a Proxy with one shared handler: a property is
// computed the first time it is read (or its descriptor is asked for) and is
// then stored on the target as a plain value.
const LAZY: Record<string, (dt: DateTime) => unknown> = Object.create(null)
for (const getter of DATETIME_GETTERS) {
  LAZY[getter] = dt => dt[getter as keyof DateTime]
}
// Backwards-compatible alias: earlier wrappers exposed `zone` as the zone name string.
LAZY.zone = dt => dt.zoneName
for (const method of DATETIME_METHODS) {
  LAZY[method] = dt => bindDateTimeMethod(dt, method)
}
const LAZY_KEYS = Object.keys(LAZY)

type DateTimeTarget = Record<string | symbol, unknown>

function materialize(target: DateTimeTarget, key: string | symbol) {
  if (
    typeof key !== 'string' ||
    !(key in LAZY) ||
    Object.prototype.hasOwnProperty.call(target, key)
  ) {
    return
  }
  Object.defineProperty(target, key, {
    value: LAZY[key](target[NATIVE_LUXON_DATE_TIME] as DateTime),
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

const DATETIME_HANDLER: ProxyHandler<DateTimeTarget> = {
  get(target, key) {
    materialize(target, key)
    return target[key as string]
  },
  has(target, key) {
    return (typeof key === 'string' && key in LAZY) || key in target
  },
  getOwnPropertyDescriptor(target, key) {
    materialize(target, key)
    return Reflect.getOwnPropertyDescriptor(target, key)
  },
  // Object.freeze/seal: once the target cannot grow, ownKeys must list only
  // what it has, so compute every lazy key first.
  preventExtensions(target) {
    for (const key of LAZY_KEYS) materialize(target, key)
    return Reflect.preventExtensions(target)
  },
  ownKeys(target) {
    const keys: (string | symbol)[] = [...LAZY_KEYS]
    for (const key of Reflect.ownKeys(target)) {
      if (typeof key !== 'string' || !(key in LAZY)) keys.push(key)
    }
    return keys
  },
}

/** Plain object with own properties/methods for JSONata 2.2+ (no prototype getter access). */
export function toJsonataDateTime(dt: DateTime) {
  const value: DateTimeTarget = {}
  Object.defineProperty(value, NATIVE_LUXON_DATE_TIME, {
    value: dt,
    enumerable: false,
  })

  // Preserve legacy serialization: returning the date directly should still
  // JSON-stringify to an ISO string (Luxon's native toJSON behaviour).
  Object.defineProperty(value, 'toJSON', {
    value: () => dt.toISO(),
    enumerable: false,
  })

  return new Proxy(value, DATETIME_HANDLER) as Record<string, unknown>
}
