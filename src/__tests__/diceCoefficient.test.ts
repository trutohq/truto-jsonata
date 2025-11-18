import { describe, expect, it } from 'vitest'
import diceCoefficient from '../functions/diceCoefficient'

describe('diceCoefficient', async () => {
  it('should return 1.0 for identical strings', async () => {
    expect(diceCoefficient('hello', 'hello')).toBe(1.0)
    expect(diceCoefficient('test', 'test')).toBe(1.0)
  })

  it('should return 0.0 for completely different strings', async () => {
    expect(diceCoefficient('hello', 'xyz')).toBe(0.0)
    expect(diceCoefficient('abc', 'def')).toBe(0.0)
  })

  it('should return a similarity score between 0 and 1', async () => {
    const score1 = diceCoefficient('hello', 'hallo')
    expect(score1).toBeGreaterThan(0)
    expect(score1).toBeLessThanOrEqual(1)

    const score2 = diceCoefficient('test', 'testing')
    expect(score2).toBeGreaterThan(0)
    expect(score2).toBeLessThanOrEqual(1)
  })

  it('should be case-insensitive', async () => {
    expect(diceCoefficient('Hello', 'HELLO')).toBe(1.0)
    expect(diceCoefficient('Test', 'test')).toBe(1.0)
  })

  it('should ignore non-alphanumeric characters', async () => {
    expect(diceCoefficient('hello-world', 'hello world')).toBe(1.0)
    expect(diceCoefficient('test_123', 'test-123')).toBe(1.0)
  })

  it('should handle similar strings correctly', async () => {
    const score = diceCoefficient('apple', 'appl')
    expect(score).toBeGreaterThan(0.5)
    expect(score).toBeLessThan(1.0)
  })

  it('should handle empty strings', async () => {
    // Empty strings return 1 (handled as a special case)
    expect(diceCoefficient('', '')).toBe(1)
    expect(diceCoefficient('hello', '')).toBe(0)
    expect(diceCoefficient('', 'hello')).toBe(0)
  })
})

