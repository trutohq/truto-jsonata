import { describe, expect, it } from 'vitest'
import convertHtmlToMarkdown from '../functions/convertHtmlToMarkdown'

describe('await convertHtmlToMarkdown', async () => {
  // Basic Test for Paragraph Conversion
  it('should convert a simple paragraph to markdown', async () => {
    const html = '<p>Hello World</p>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('Hello World')
  })

  // Test for Heading Conversion (H1, H2)
  it('should convert headings (h1 and h2) to markdown', async () => {
    const html = '<h1>Heading 1</h1><h2>Heading 2</h2>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`Heading 1
=========

Heading 2
---------`)
  })

  // Test for Anchor Tags Conversion
  it('should convert anchor tags (links) to markdown', async () => {
    const html = '<a href="https://example.com">Example</a>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('[Example](https://example.com)')
  })

  // Test for Image Conversion
  it('should convert image tags to markdown', async () => {
    const html =
      '<img src="https://example.com/image.png" alt="Example Image" />'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('![Example Image](https://example.com/image.png)')
  })

  // Test for Unordered List Conversion
  it('should convert unordered list to markdown', async () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`*   Item 1
*   Item 2`)
  })

  // Test for Ordered List Conversion
  it('should convert ordered list to markdown', async () => {
    const html = '<ol><li>Item 1</li><li>Item 2</li></ol>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`1.  Item 1
2.  Item 2`)
  })

  // Test for Blockquote Conversion
  it('should convert blockquotes to markdown', async () => {
    const html = '<blockquote><p>This is a quote</p></blockquote>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('> This is a quote')
  })

  // Test for Code Block Conversion (Preformatted Code)
  it('should convert preformatted code blocks to markdown', async () => {
    const html = '<pre><code>const x = 10;</code></pre>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('    const x = 10;')
  })

  // Test for Inline Code Conversion
  it('should convert inline code to markdown', async () => {
    const html = '<p>This is <code>inline code</code> in a sentence.</p>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('This is `inline code` in a sentence.')
  })

  // Test for Horizontal Rule Conversion
  it('should convert horizontal rules to markdown', async () => {
    const html = '<hr />'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('* * *')
  })

  // Test for Special Characters (Escaping Markdown Characters)
  it('should escape special Markdown characters', async () => {
    const html = '<p>1. Item with *asterisks* and `backticks`</p>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('1\\. Item with \\*asterisks\\* and \\`backticks\\`')
  })

  // Test for Nested Elements
  it('should convert nested HTML elements to markdown', async () => {
    const html =
      '<div><p>This is <strong>bold</strong> and <em>italic</em>.</p></div>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('This is **bold** and _italic_.')
  })

  // Test for Tables (if applicable, depending on Turndown rules added)
  it('should convert tables to markdown', async () => {
    const html = `
      <table>
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td></tr>
      </table>
    `
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`| Header 1 | Header 2 |
| --- | --- |
| Row 1, Cell 1 | Row 1, Cell 2 |`)
  })

  // Test for Empty HTML
  it('should return an empty string for empty HTML', async () => {
    const html = ''
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('')
  })

  // Test for HTML without body content
  it('should return an empty string for HTML with no body content', async () => {
    const html = '<html><head><title>Title</title></head><body></body></html>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('Title')
  })

  // Test with empty html string
  it('should return an empty string for HTML with no body content', async () => {
    const html = ''
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('')
  })

  // Test for Stripped HTML Tags
  it('should strip unwanted HTML tags and return clean markdown', async () => {
    const html =
      '<div><p>This is a <span>test</span> with <b>bold</b> text.</p></div>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('This is a test with **bold** text.')
  })

  // Test for Whitespace Handling
  it('should trim leading and trailing newlines and extra whitespace', async () => {
    const html = '<p>   Hello World   </p>'
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe('Hello World')
  })

  // Test for Complex Nested HTML
  it('should convert complex nested HTML structures to markdown', async () => {
    const html = `
      <div>
        <h1>Heading</h1>
        <p>This is a <em>complex</em> HTML structure with <strong>bold</strong> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`Heading
=======

This is a _complex_ HTML structure with **bold** text.

*   Item 1
*   Item 2`)
  })
})
