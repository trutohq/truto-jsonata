import { DateTime } from 'luxon'
import { toJsonataDateTime } from './toJsonataDateTime'

function dtFromIso(arg: string, zone?: string) {
  let dt = DateTime.fromISO(arg)
  if (zone) {
    dt = dt.setZone(zone)
  }
  return toJsonataDateTime(dt)
}

export default dtFromIso
