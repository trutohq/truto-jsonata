import { DateTime } from 'luxon'

function dtFromFormat(date: string, format: string) {
  if (format === 'RFC2822') {
    return DateTime.fromRFC2822(date)
  }
  if (format === 'ISO') {
    return DateTime.fromISO(date)
  }
  if (format === 'fromSeconds') {
    return DateTime.fromSeconds(parseInt(date))
  }
  return DateTime.fromFormat(date, format)
}

export default dtFromFormat
