import uuid from '../functions/uuid'
import { describe, expect, it } from 'vitest'

describe('uuid', () => {
  it('should generate a valid UUID', () => {
    const _uuid = uuid()
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(_uuid).toMatch(uuidRegex)
  })

  it('should generate unique UUIDs', () => {
    const uuid1 = uuid()
    const uuid2 = uuid()
    expect(uuid1).not.toBe(uuid2)
  })
})
