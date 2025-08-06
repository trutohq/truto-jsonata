import { describe, expect, it } from 'vitest'
import convertMarkdownToAdf from '../functions/convertMarkdownToAdf'

const markdown = `
# Meeting with Nachi

Paragraph with _italic_ and **bold** text and ~strikethrough~. And a [link](https://www.notion.so). And an image with some other text.

> Blockquote with *bold* and _italic_ text.

---

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |

| First Header  | Second Header |
| ------------- | ------------- |
| **Content** Cell  | [Content](https://notion.so) Cell  |
| Content Cell  | _Content_ Cell  |

- List [item 1](https://www.notion.so)
- List **item** 2
- List _item_ 3

Some text before that

- [ ] **Checkbox** 1
- [x] _Checkbox_ 2 
- [ ] [Checkbox](https://www.notion.so) 3

Some text after that

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

\`code item here\`

\`\`\`
Code block here
\`\`\`
`

describe('convertMarkdownToAdf', () => {
  it('should convert markdown to ADF format', () => {
    const adf = convertMarkdownToAdf(markdown)

    // Verify it returns an object (ADF format)
    expect(adf).toBeDefined()
    expect(typeof adf).toBe('object')

    // Verify it has the expected ADF structure
    expect(adf).toHaveProperty('version')
    expect(adf).toHaveProperty('type')
    expect(adf).toHaveProperty('content')

    // Verify version and type
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')

    // Verify content is an array
    expect(Array.isArray(adf.content)).toBe(true)
  })

  it('should handle simple markdown elements', () => {
    const simpleMarkdown = `
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

[Link text](https://example.com)

![Alt text](https://example.com/image.jpg)

> Blockquote

\`inline code\`

\`\`\`
code block
\`\`\`
`

    const adf = convertMarkdownToAdf(simpleMarkdown)

    expect(adf).toBeDefined()
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')
    expect(Array.isArray(adf.content)).toBe(true)
  })

  it('should handle lists', () => {
    const listMarkdown = `
- Unordered list item 1
- Unordered list item 2
  - Nested item
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

- [ ] Unchecked task
- [x] Checked task
`

    const adf = convertMarkdownToAdf(listMarkdown)

    expect(adf).toBeDefined()
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')
    expect(Array.isArray(adf.content)).toBe(true)
  })

  it('should handle tables', () => {
    const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`

    const adf = convertMarkdownToAdf(tableMarkdown)

    expect(adf).toBeDefined()
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')
    expect(Array.isArray(adf.content)).toBe(true)
  })

  it('should handle empty markdown', () => {
    const adf = convertMarkdownToAdf('')

    expect(adf).toBeDefined()
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')
    expect(Array.isArray(adf.content)).toBe(true)
  })

  it('should handle whitespace-only markdown', () => {
    const adf = convertMarkdownToAdf('   \n\n  ')

    expect(adf).toBeDefined()
    expect(adf.version).toBe(1)
    expect(adf.type).toBe('doc')
    expect(Array.isArray(adf.content)).toBe(true)
  })
})
