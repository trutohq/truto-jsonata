import generateUUID from '../functions/uuid'
import { describe, expect, it } from 'vitest'

describe('generateUUID', () => {
  it('should generate a valid UUID', () => {
    const uuid = generateUUID()
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(uuid).toMatch(uuidRegex)
  })

  it('should generate unique UUIDs', () => {
    const uuid1 = generateUUID()
    const uuid2 = generateUUID()
    expect(uuid1).not.toBe(uuid2)
  })
})
