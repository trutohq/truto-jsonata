import type { DateTime } from 'luxon'
import { toJsonataNative } from './toJsonataNative'

/**
 * A luxon DateTime as JSONata 2.2 must see it: its own keys (ts, c, loc, …)
 * listed, every getter and method readable, and the native back on unwrap.
 */
export function toJsonataDateTime(dt: DateTime) {
  return toJsonataNative(dt) as Record<string, unknown>
}
