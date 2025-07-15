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

  it('should convert Confluence HTML to Markdown', async () => {
    const html = `
      <div class="contentLayout2">
<div class="columnLayout single" data-layout="single">
<div class="cell normal" data-type="normal">
<div class="innerCell">
<div class="confluence-information-macro confluence-information-macro-information"><p class="title">Page Owner</p><span class="aui-icon aui-icon-small aui-iconfont-info confluence-information-macro-icon"></span><div class="confluence-information-macro-body"><p><a class="confluence-userlink user-mention" data-account-id="614bdc3cf1c17400683d5507" href="https://aventriahg2x.atlassian.net/wiki/people/614bdc3cf1c17400683d5507?ref=confluence" target="_blank" data-linked-resource-id="262249" data-linked-resource-version="1" data-linked-resource-type="userinfo" data-base-url="https://aventriahg2x.atlassian.net/wiki">Kathleen Kurtz</a> owns the hF Health Tool Section and is the Content Owner of this Section</p></div></div></div>
</div>
</div>
<div class="columnLayout two-equal" data-layout="two-equal">
<div class="cell normal" data-type="normal">
<div class="innerCell">
<p>


<div class="plugin_pagetree">

                                                    <div id="pagetreesearch">
                    <form method="POST" class="aui"
                          action="/wiki/plugins/pagetreesearch/pagetreesearch.action"
                          name="pagetreesearchform">
                                                    <input type="hidden" name="ancestorId" value="18938790024">
                                                <input type="hidden" name="spaceKey" value="HF2">
                        <input type="text" class="text medium-field" size="20" name="queryString">
                        <input type="submit" class="aui-button" value="Search">
                    </form>
                </div>
                    
                            <div>
                <span class="plugin_pagetree_status hidden">Collapse all</span>
                <div class="plugin_pagetree_expandcollapse">
                    <a class="plugin_pagetree_expandall" href="#">Expand all</a>   
                    <a class="plugin_pagetree_collapseall" href="#">Collapse all</a>
                </div>
            </div>
        
        <ul class="plugin_pagetree_children_list plugin_pagetree_children_list_noleftspace">
            <div class="plugin_pagetree_children">
            </div>
        </ul>

        <fieldset class="hidden">
            <input type="hidden" name="treeId" value="">
            <input type="hidden" name="treeRequestId"
                   value="/wiki/plugins/pagetree/naturalchildren.action?decorator=none&amp;excerpt=true&amp;sort=position&amp;reverse=false&amp;disableLinks=false&amp;expandCurrent=false">
            <input type="hidden" name="treePageId" value="18938790024">

            <input type="hidden" name="noRoot" value="false">
            <input type="hidden" name="rootPageId" value="18938790024">

            <input type="hidden" name="rootPage" value="">
            <input type="hidden" name="startDepth" value="0">
            <input type="hidden" name="spaceKey" value="HF2">

            <input type="hidden" name="i18n-pagetree.loading" value="Loading...">
            <input type="hidden" name="i18n-pagetree.error.permission"
                   value="Unable to load page tree. It seems that you do not have permission to view the root page.">
            <input type="hidden" name="i18n-pagetree.eeror.general" value="There was a problem retrieving the page tree. Please check the server log file for more information.">
            <input type="hidden" name="loginUrl" value="/wiki/login.action?os_destination=%2Fapi%2Fv2%2Fpages%2F18938790024%3Fbody-format%3Dexport_view%26include-labels%3Dtrue">
            <input type="hidden" name="mobile" value="false">

                        <fieldset class="hidden">
                                    <input type="hidden" name="ancestorId" value="18938790024">
                            </fieldset>
        </fieldset>
    </div>

</p><p> </p><p> </p></div>
</div>
<div class="cell normal" data-type="normal">
<div class="innerCell">
<p><br/><br/></p></div>
</div>
</div>
<div class="columnLayout single" data-layout="single">
<div class="cell normal" data-type="normal">
<div class="innerCell">
<div class="table-wrap"><table class="wrapped confluenceTable"><colgroup><col/><col/><col/><col/><col/></colgroup></table></div></div>
</div>
</div>
</div>
    `
    const markdown = await convertHtmlToMarkdown(html)
    expect(markdown).toBe(`Page Owner

[Kathleen Kurtz](https://aventriahg2x.atlassian.net/wiki/people/614bdc3cf1c17400683d5507?ref=confluence) owns the hF Health Tool Section and is the Content Owner of this Section

   

Collapse all

[Expand all](#) [Collapse all](#)`)
  })
})
