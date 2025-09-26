import { describe, expect, it } from 'vitest'
import convertMdToPdf from '../functions/convertMdToPdf'

describe('convertMdToPdf', () => {
  it('should convert simple markdown to PDF blob', () => {
    const markdown = '# Test Heading\n\nThis is a paragraph.'
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle headings of different levels', () => {
    const markdown = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
`
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle lists', () => {
    const markdown = `
## Unordered List
- Item 1
- Item 2
- Item 3

## Ordered List
1. First item
2. Second item
3. Third item
`
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle tables', () => {
    const markdown = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More     |
| Row 2    | Info     | Content  |
`
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle blockquotes', () => {
    const markdown = `
> This is a blockquote
> with multiple lines
> of quoted text.
`
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle horizontal rules', () => {
    const markdown = `
Some content above

---

Some content below
`
    const result = convertMdToPdf(markdown)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle images with embedImages disabled', () => {
    const markdown = `
![Alt text](https://example.com/image.png)

Some text after image.
`
    const result = convertMdToPdf(markdown, { embedImages: false })

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should respect custom options', () => {
    const markdown = '# Test Document'
    const options = {
      title: 'Custom Title',
      pageSize: 'LETTER',
      embedImages: false,
      pageMargins: [20, 30, 20, 30],
    }

    const result = convertMdToPdf(markdown, options)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle empty markdown', () => {
    const result = convertMdToPdf('')

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('should handle markdown with only whitespace', () => {
    const result = convertMdToPdf('   \n\n   \t   ')

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })
})
