import { describe, expect, it } from 'vitest'
import convertMarkdownToNotion from '../functions/convertMarkdownToNotion'

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

describe('convertMarkdownToNotion', async () => {
  it('test', async () => {
    const notionBlocks = convertMarkdownToNotion(markdown)
    expect(notionBlocks).toEqual({
      children: [
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [
              { type: 'text', text: { content: 'Meeting with Nachi' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Paragraph with ' } },
              {
                type: 'text',
                text: { content: 'italic' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' and ' } },
              {
                type: 'text',
                text: { content: 'bold' },
                annotations: { bold: true },
              },
              { type: 'text', text: { content: ' text and ' } },
              { type: 'text', text: { content: 'strikethrough' } },
              { type: 'text', text: { content: '. And a ' } },
              {
                type: 'text',
                text: {
                  content: 'link',
                  link: { url: 'https://www.notion.so' },
                },
              },
              {
                type: 'text',
                text: { content: '. And an image with some other text.' },
              },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Some text with an ' } },
              {
                type: 'text',
                text: { content: 'inline image' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' ' } },
              { type: 'text', text: { content: ' and other ' } },
              {
                type: 'text',
                text: { content: 'content' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' after it.' } },
            ],
          },
        },
        {
          type: 'image',
          image: {
            type: 'external',
            external: {
              url: 'https://assets3.thrillist.com/v1/image/1682388/size/tl-horizontal_main.jpg',
            },
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'callout',
          callout: {
            rich_text: [
              { type: 'text', text: { content: 'Blockquote with ' } },
              {
                type: 'text',
                text: { content: 'bold' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' and ' } },
              {
                type: 'text',
                text: { content: 'italic' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' text.' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        { type: 'divider', divider: {} },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'table',
          table: {
            table_width: 2,
            has_column_header: true,
            has_row_header: false,
            children: [
              {
                type: 'table_row',
                table_row: {
                  cells: [
                    [{ type: 'text', text: { content: 'First Header' } }],
                    [{ type: 'text', text: { content: 'Second Header' } }],
                  ],
                },
              },
              {
                type: 'table_row',
                table_row: {
                  cells: [
                    [{ type: 'text', text: { content: 'Content Cell' } }],
                    [{ type: 'text', text: { content: 'Content Cell' } }],
                  ],
                },
              },
            ],
          },
        },
        {
          type: 'table',
          table: {
            table_width: 2,
            has_column_header: true,
            has_row_header: false,
            children: [
              {
                type: 'table_row',
                table_row: {
                  cells: [
                    [{ type: 'text', text: { content: 'First Header' } }],
                    [{ type: 'text', text: { content: 'Second Header' } }],
                  ],
                },
              },
              {
                type: 'table_row',
                table_row: {
                  cells: [
                    [
                      {
                        type: 'text',
                        text: { content: 'Content' },
                        annotations: { bold: true },
                      },
                      { type: 'text', text: { content: ' Cell' } },
                    ],
                    [
                      {
                        type: 'text',
                        text: {
                          content: 'Content',
                          link: { url: 'https://notion.so' },
                        },
                      },
                      { type: 'text', text: { content: ' Cell' } },
                    ],
                  ],
                },
              },
              {
                type: 'table_row',
                table_row: {
                  cells: [
                    [{ type: 'text', text: { content: 'Content Cell' } }],
                    [
                      {
                        type: 'text',
                        text: { content: 'Content' },
                        annotations: { italic: true },
                      },
                      { type: 'text', text: { content: ' Cell' } },
                    ],
                  ],
                },
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'List ' } },
              {
                type: 'text',
                text: {
                  content: 'item 1',
                  link: { url: 'https://www.notion.so' },
                },
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'List ' } },
              {
                type: 'text',
                text: { content: 'item' },
                annotations: { bold: true },
              },
              { type: 'text', text: { content: ' 2' } },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'List ' } },
              {
                type: 'text',
                text: { content: 'item' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' 3' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Some text before that' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Checkbox' },
                annotations: { bold: true },
              },
              { type: 'text', text: { content: ' 1' } },
            ],
            checked: false,
          },
        },
        {
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Checkbox' },
                annotations: { italic: true },
              },
              { type: 'text', text: { content: ' 2 ' } },
            ],
            checked: true,
          },
        },
        {
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Checkbox',
                  link: { url: 'https://www.notion.so' },
                },
              },
              { type: 'text', text: { content: ' 3' } },
            ],
            checked: false,
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Some text after that' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'Ordered list item 1' } },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'Ordered list item 2' } },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              { type: 'text', text: { content: 'Ordered list item 3' } },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'code item here' },
                annotations: { code: true },
              },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: '\n' } }] },
        },
        {
          type: 'code',
          code: {
            rich_text: [{ type: 'text', text: { content: 'Code block here' } }],
            language: 'plain text',
          },
        },
      ],
    })
  })
})
