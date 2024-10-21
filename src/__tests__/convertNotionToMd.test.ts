import { describe, expect, it } from 'vitest'

import convertNotionToMd from '../functions/convertNotionToMd'

it('should convert a heading_2 block to markdown', () => {
  const block = {
    type: 'heading_2',
    heading_2: {
      rich_text: [{ plain_text: 'Heading 2' }],
    },
  }
  const result = convertNotionToMd(block)
  expect(result).toBe('## Heading 2\n')
})

it('should convert a heading_3 block to markdown', () => {
  const block = {
    type: 'heading_3',
    heading_3: {
      rich_text: [{ plain_text: 'Heading 3' }],
    },
  }
  const result = convertNotionToMd(block)
  expect(result).toBe('### Heading 3\n')
})
it('should convert a numbered list item block to markdown', () => {
  const block = {
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: [{ plain_text: 'Item 1' }],
    },
  }
  const result = convertNotionToMd(block)
  expect(result).toBe('1. Item 1 \n')
})
