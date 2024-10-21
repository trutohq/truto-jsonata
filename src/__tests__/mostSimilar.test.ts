import { describe, expect, it } from 'vitest'
import mostSimilar from '../functions/mostSimilar'

describe('mostSimilar', async () => {
  it('should return the most similar value', async () => {
    const possibleValues = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR']
    expect(mostSimilar('Full-Time', possibleValues)).toBe('FULL_TIME')
    expect(mostSimilar('Full Time', possibleValues)).toBe('FULL_TIME')
    expect(mostSimilar('full_time', possibleValues)).toBe('FULL_TIME')
    expect(mostSimilar('partTime', possibleValues)).toBe('PART_TIME')
  })
  it('should return the original value if no similar value is found', async () => {
    const possibleValues = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR']
    expect(mostSimilar('Full', possibleValues)).toBe('Full')
  })
})
