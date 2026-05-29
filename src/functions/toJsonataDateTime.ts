import { DateTime, Duration } from 'luxon'

export type JsonataDateTime = ReturnType<typeof toJsonataDateTime>

const LUXON_DATE_TIME = Symbol('luxonDateTime')

const DATETIME_METHODS = [
  'plus',
  'minus',
  'startOf',
  'endOf',
  'setZone',
  'toUTC',
  'toFormat',
  'toISO',
  'toISODate',
  'toJSDate',
  'toMillis',
  'toSeconds',
  'diff',
] as const

function wrapDuration(duration: Duration) {
  return {
    ...duration.toObject(),
    toObject: () => ({ ...duration.toObject() }),
  }
}

export function unwrapJsonataDateTime(value: unknown): unknown {
  if (value && typeof value === 'object' && LUXON_DATE_TIME in value) {
    return (value as Record<symbol, DateTime>)[LUXON_DATE_TIME]
  }
  return value
}

function bindDateTimeMethod(dt: DateTime, method: (typeof DATETIME_METHODS)[number]) {
  const fn = dt[method].bind(dt) as (...args: unknown[]) => unknown
  return (...args: unknown[]) => {
    const result = fn(...args.map(unwrapJsonataDateTime))
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
  const value: Record<string, unknown> = {
    ...dt.toObject(),
    zone: dt.zoneName,
    isValid: dt.isValid,
  }

  for (const method of DATETIME_METHODS) {
    value[method] = bindDateTimeMethod(dt, method)
  }

  Object.defineProperty(value, LUXON_DATE_TIME, {
    value: dt,
    enumerable: false,
  })

  return value
}
