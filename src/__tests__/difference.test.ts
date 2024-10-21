import differenceArray from '../functions/difference'
import { describe, expect, it } from 'vitest'

describe('differenceArray', () => {
  it('should return the difference between two arrays', () => {
    const arr1 = [1, 2, 3, 4]
    const arr2 = [3, 4, 5, 6]
    const result = differenceArray(arr1, arr2)
    expect(result).toEqual([1, 2])
  })

  it('should return an empty array when there is no difference', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [1, 2, 3]
    const result = differenceArray(arr1, arr2)
    expect(result).toEqual([])
  })

  it('should return the first array when the second array is empty', () => {
    const arr1 = [1, 2, 3]
    const arr2: number[] = []
    const result = differenceArray(arr1, arr2)
    expect(result).toEqual([1, 2, 3])
  })

  it('should return an empty array when the first array is empty', () => {
    const arr1: number[] = []
    const arr2 = [1, 2, 3]
    const result = differenceArray(arr1, arr2)
    expect(result).toEqual([])
  })

  it('should handle arrays with duplicate elements', () => {
    const arr1 = [1, 2, 2, 3, 4]
    const arr2 = [3, 4, 4, 5, 6]
    const result = differenceArray(arr1, arr2)
    expect(result).toEqual([1, 2])
  })
})
