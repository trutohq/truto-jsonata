import { describe, it, expect } from 'vitest'
import trutoJsonata from '../index'

describe('flattenDepth', () => {
  it('flattens nested arrays to specified depth', async () => {
    const expr = trutoJsonata('$flattenDepth([1, [2, [3, [4, [5]]]]], 2)')
    expect(await expr.evaluate({})).toEqual([1, 2, 3, [4, [5]]])
  })
  it('flattens with depth 1 (same as flatten)', async () => {
    const expr = trutoJsonata('$flattenDepth([1, [2, [3]]], 1)')
    expect(await expr.evaluate({})).toEqual([1, 2, [3]])
  })
  it('flattens with depth greater than nesting', async () => {
    const expr = trutoJsonata('$flattenDepth([1, [2, [3, [4]]]], 10)')
    expect(await expr.evaluate({})).toEqual([1, 2, 3, 4])
  })
  it('returns the same array if depth is 0', async () => {
    const expr = trutoJsonata('$flattenDepth([1, [2, [3]]], 0)')
    expect(await expr.evaluate({})).toEqual([1, [2, [3]]])
  })
  it('handles non-array input by wrapping and flattening', async () => {
    const expr = trutoJsonata('$flattenDepth(1, 2)')
    expect(await expr.evaluate({})).toEqual([1])
  })
})
