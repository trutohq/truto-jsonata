import { DateTime, DateTimeOptions } from 'luxon'
import { toJsonataDateTime } from './toJsonataDateTime'

function dtFromFormat(date: string, format: string, options?: DateTimeOptions) {
  let dt: DateTime
  if (format === 'RFC2822') {
    dt = DateTime.fromRFC2822(date, options)
  } else if (format === 'ISO') {
    dt = DateTime.fromISO(date, options)
  } else if (format === 'fromSeconds') {
    dt = DateTime.fromSeconds(parseInt(date), options)
  } else {
    dt = DateTime.fromFormat(date, format, options)
  }
  return toJsonataDateTime(dt)
}

export default dtFromFormat
