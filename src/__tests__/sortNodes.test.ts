import { describe, expect, it } from 'vitest'
import sortNodes from '../functions/sortNodes'
import { Node } from '../functions/sortNodes'

const data: Node[] = [
  { id: 1, parent_id: 10, sequence: 0, extra_attr: 'foo' }, // No parent with id 10
  { id: 2, parent_id: 1, sequence: 0 },
  { id: 3, parent_id: 1, sequence: 1 },
  { id: 4, parent_id: 2, sequence: 0, extra_attr: 'bar' },
  { id: 5, parent_id: null, sequence: 1 },
]

describe('sortNodes', () => {
  it('should flatten the array and order it', () => {
    const sortedData = sortNodes(data)
    expect(sortedData).toEqual([
      { id: 1, parent_id: 10, sequence: 0, extra_attr: 'foo' },
      { id: 2, parent_id: 1, sequence: 0 },
      { id: 4, parent_id: 2, sequence: 0, extra_attr: 'bar' },
      { id: 3, parent_id: 1, sequence: 1 },
      { id: 5, parent_id: null, sequence: 1 },
    ])
  })
})
