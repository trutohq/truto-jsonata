import { describe, it, expect } from 'vitest'
import trutoJsonata from '../index'

describe('flattenDeep', () => {
  it('flattens deeply nested arrays completely', async () => {
    const expr = trutoJsonata('$flattenDeep([1, [2, [3, [4, [5]]]]])')
    expect(await expr.evaluate({})).toEqual([1, 2, 3, 4, 5])
  })
  it('returns the same array if already flat', async () => {
    const expr = trutoJsonata('$flattenDeep([1, 2, 3])')
    expect(await expr.evaluate({})).toEqual([1, 2, 3])
  })
  it('handles non-array input by wrapping and flattening', async () => {
    const expr = trutoJsonata('$flattenDeep(1)')
    expect(await expr.evaluate({})).toEqual([1])
  })
  it('handles array of empty arrays', async () => {
    const expr = trutoJsonata('$flattenDeep([[], []])')
    expect(await expr.evaluate({})).toEqual([])
  })
})
