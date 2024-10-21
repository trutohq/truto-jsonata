import zipSqlResponse from '../functions/zipSqlResponse'
import { describe, expect, it } from 'vitest'

describe('zipSqlResponse', () => {
  it('should correctly zip SQL response', () => {
    const columns = [{ key: 'id' }, { key: 'name' }]
    const data = [
      [1, 'Alice'],
      [2, 'Bob'],
    ]
    const key = 'key'
    const expectedOutput = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const result = zipSqlResponse(columns, data, key)
    expect(result).toEqual(expectedOutput)
  })

  it('should handle empty input', () => {
    const columns: any[] = []
    const data: any[] = []
    const key = 'key'
    const expectedOutput: any[] = []

    const result = zipSqlResponse(columns, data, key)
    expect(result).toEqual(expectedOutput)
  })

  it('should handle input with missing fields', () => {
    const columns = [{ key: 'id' }, { key: 'name' }]
    const data = [[1, 'Alice'], [2]]
    const key = 'key'
    const expectedOutput = [
      { id: 1, name: 'Alice' },
      { id: 2, name: undefined },
    ]

    const result = zipSqlResponse(columns, data, key)
    expect(result).toEqual(expectedOutput)
  })

  it('should handle columns with different keys', () => {
    const columns = [{ col: 'id' }, { col: 'name' }]
    const data = [
      [1, 'Alice'],
      [2, 'Bob'],
    ]
    const key = 'col'
    const expectedOutput = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const result = zipSqlResponse(columns, data, key)
    expect(result).toEqual(expectedOutput)
  })

  it('should handle data with extra fields', () => {
    const columns = [{ key: 'id' }, { key: 'name' }]
    const data = [
      [1, 'Alice', 'extra'],
      [2, 'Bob', 'extra'],
    ]
    const key = 'key'
    const expectedOutput = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const result = zipSqlResponse(columns, data, key)
    expect(result).toEqual(expectedOutput)
  })
})
