import { describe, it, expect } from 'vitest'
import trutoJsonata from '../index'

describe('flatten', () => {
  it('flattens a nested array one level deep', async () => {
    const expr = trutoJsonata('$flatten([1, [2, [3]]])')
    expect(await expr.evaluate({})).toEqual([1, 2, [3]])
  })

  it('returns the same array if already flat', async () => {
    const expr = trutoJsonata('$flatten([1, 2, 3])')
    expect(await expr.evaluate({})).toEqual([1, 2, 3])
  })

  it('flattens deeply nested arrays only one level', async () => {
    const expr = trutoJsonata('$flatten([1, [2, [3, [4]]], 5])')
    expect(await expr.evaluate({})).toEqual([1, 2, [3, [4]], 5])
  })

  it('returns an empty array when input is empty', async () => {
    const expr = trutoJsonata('$flatten([])')
    expect(await expr.evaluate({})).toEqual([])
  })

  it('handles non-array input by wrapping and flattening', async () => {
    const expr = trutoJsonata('$flatten(1)')
    expect(await expr.evaluate({})).toEqual([1])
  })

  it('handles array of empty arrays', async () => {
    const expr = trutoJsonata('$flatten([[], []])')
    expect(await expr.evaluate({})).toEqual([])
  })
})
