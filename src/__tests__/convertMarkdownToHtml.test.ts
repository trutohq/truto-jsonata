import { describe, expect, it } from 'vitest'
import convertMarkdownToHtml from '../functions/convertMarkdownToHtml'

const markdown = `
# Meeting with Nachi

Paragraph with _italic_ and **bold** text and ~strikethrough~. And a [link](https://www.notion.so). And an image with some other text.

Some text with an *inline image* ![image](https://assets3.thrillist.com/v1/image/1682388/size/tl-horizontal_main.jpg) and other _content_ after it.

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

const expectedContent = `<h1>Meeting with Nachi</h1>
<p>Paragraph with <em>italic</em> and <strong>bold</strong> text and <del>strikethrough</del>. And a <a href="https://www.notion.so">link</a>. And an image with some other text.</p>
<p>Some text with an <em>inline image</em> <img src="https://assets3.thrillist.com/v1/image/1682388/size/tl-horizontal_main.jpg" alt="image"> and other <em>content</em> after it.</p>
<blockquote>
<p>Blockquote with <em>bold</em> and <em>italic</em> text.</p>
</blockquote>
<hr>
<table>
<thead>
<tr>
<th>First Header</th>
<th>Second Header</th>
</tr>
</thead>
<tbody><tr>
<td>Content Cell</td>
<td>Content Cell</td>
</tr>
</tbody></table>
<table>
<thead>
<tr>
<th>First Header</th>
<th>Second Header</th>
</tr>
</thead>
<tbody><tr>
<td><strong>Content</strong> Cell</td>
<td><a href="https://notion.so">Content</a> Cell</td>
</tr>
<tr>
<td>Content Cell</td>
<td><em>Content</em> Cell</td>
</tr>
</tbody></table>
<ul>
<li>List <a href="https://www.notion.so">item 1</a></li>
<li>List <strong>item</strong> 2</li>
<li>List <em>item</em> 3</li>
</ul>
<p>Some text before that</p>
<ul>
<li><input disabled="" type="checkbox"> <strong>Checkbox</strong> 1</li>
<li><input checked="" disabled="" type="checkbox"> <em>Checkbox</em> 2 </li>
<li><input disabled="" type="checkbox"> <a href="https://www.notion.so">Checkbox</a> 3</li>
</ul>
<p>Some text after that</p>
<ol>
<li>Ordered list item 1</li>
<li>Ordered list item 2</li>
<li>Ordered list item 3</li>
</ol>
<p><code>code item here</code></p>
<pre><code>Code block here
</code></pre>
`

describe('convertMarkdownToHtml', async () => {
  it('test', async () => {
    const html = await convertMarkdownToHtml(markdown)
    expect(html).toEqual(expectedContent)
  })
})
