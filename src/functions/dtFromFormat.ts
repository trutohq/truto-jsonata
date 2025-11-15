import { DateTime, DateTimeOptions } from 'luxon'

function dtFromFormat(date: string, format: string, options?: DateTimeOptions) {
  if (format === 'RFC2822') {
    return DateTime.fromRFC2822(date, options)
  }
  if (format === 'ISO') {
    return DateTime.fromISO(date, options)
  }
  if (format === 'fromSeconds') {
    return DateTime.fromSeconds(parseInt(date), options)
  }
  return DateTime.fromFormat(date, format, options)
}

export default dtFromFormat
