import removeEmptyItems from '../functions/removeEmptyItems'
import { describe, expect, it } from 'vitest'

describe('removeEmptyItems', () => {
  it('should return the same array if no empty items are present', () => {
    const input = [1, 'string', true, { key: 'value' }]
    const output = removeEmptyItems(input)
    expect(output).toEqual(input)
  })

  it('should remove empty objects from the array', () => {
    const input = [1, {}, 'string', { key: 'value' }, {}]
    const output = removeEmptyItems(input)
    expect(output).toEqual([1, 'string', { key: 'value' }])
  })

  it('should remove null and undefined values from the array', () => {
    const input = [1, null, 'string', undefined, { key: 'value' }]
    const output = removeEmptyItems(input)
    expect(output).toEqual([1, 'string', { key: 'value' }])
  })

  it('should return an empty array if all items are empty', () => {
    const input = [null, undefined, {}, []]
    const output = removeEmptyItems(input)
    expect(output).toEqual([])
  })

  it('should handle nested objects correctly', () => {
    const input = [1, { nested: {} }, 'string', { key: 'value' }]
    const output = removeEmptyItems(input)
    expect(output).toEqual([1, { nested: {} }, 'string', { key: 'value' }])
  })

  it('should return the input if it is not an array', () => {
    const input = 'not an array'
    const output = removeEmptyItems(input as unknown as Array<unknown>)
    expect(output).toEqual(input)
  })
})
