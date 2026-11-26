import { DateTime } from 'luxon'
import { toJsonataDateTime } from './toJsonataDateTime'

// `zone` is applied only when luxon accepts it. 2.x ignored any second
// argument, and stored expressions pass a format there by mistake
// (`$dtFromIso(date, 'yyyy-MM-dd')`); an invalid zone would turn every such
// date into an invalid DateTime, so it is ignored instead.
function dtFromIso(arg: string, zone?: string) {
  const dt = DateTime.fromISO(arg)
  if (zone && dt.isValid) {
    const zoned = dt.setZone(zone)
    if (zoned.isValid) return toJsonataDateTime(zoned)
  }
  return toJsonataDateTime(dt)
}

export default dtFromIso
