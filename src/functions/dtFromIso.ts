import { DateTime } from 'luxon'

function dtFromIso(arg: string) {
  return DateTime.fromISO(arg)
}

export default dtFromIso
