import json2md from 'json2md'

function convertNotionToMd(block: any) {
  const data = block[block.type]
  const plainText = data.rich_text
    ? // @ts-ignore
      data.rich_text.map(x => {
        if (x) {
          if (x.href) {
            return `[${x.plain_text}](${
              x.href.startsWith('/') ? `https://www.notion.so${x.href}` : x.href
            })`
          }
          return x.plain_text
        }
      })
    : []
  // @ts-ignore
  const caption = data.caption ? data.caption.map(x => x?.plain_text) : []
  switch (block.type) {
    case 'bookmark':
      return json2md({
        link: {
          title: data.url,
          source: data.url,
        },
      })
    case 'bulleted_list_item':
      return `${json2md({
        ul: plainText,
      }).trim()} \n`
    case 'numbered_list_item':
      return `${json2md({
        ol: plainText,
      }).trim()} \n`
    case 'quote':
    case 'callout':
      return json2md({
        blockquote: plainText,
      })
    case 'code':
      return json2md({
        code: {
          language: data.language,
          content: plainText,
        },
      })
    case 'divider':
      return '--- \n'
    case 'embed':
      return json2md({
        link: {
          title: caption.length ? caption : 'Embed',
          source: data.url,
        },
      })
    case 'equation':
      return json2md({ p: data.expression })
    case 'paragraph':
      return json2md({ p: plainText.join('') })
    case 'video':
    case 'pdf':
    case 'file':
      return json2md({
        link: {
          title: caption.length ? caption : 'File',
          source: data.file
            ? data.file.url
            : data.external
            ? data.external.url
            : '',
        },
      })
    case 'heading_1':
      return json2md({
        h1: plainText,
      })
    case 'heading_2':
      return json2md({
        h2: plainText,
      })
    case 'heading_3':
      return json2md({
        h3: plainText,
      })
    case 'heading_4':
      return json2md({
        h4: plainText,
      })
    case 'heading_5':
      return json2md({
        h5: plainText,
      })
    case 'heading_6':
      return json2md({
        h6: plainText,
      })
    case 'image':
      return json2md({
        img: {
          title: caption.length ? caption : 'Image',
          // @ts-ignore
          alt: caption.length ? caption : 'Image',
          source: data.file
            ? data.file.url
            : data.external
            ? data.external.url
            : '',
        },
      })
    case 'table':
      return json2md({
        p: 'Tabular values as CSV',
      })
    case 'table_row':
      // @ts-ignore
      return json2md({ p: data.cells.map(x => x[0]?.plain_text).join(',') })
    case 'to_do':
      return `- [${data.checked ? 'X' : ' '}] ${plainText.join('')}\n`
    default:
      return json2md({ p: plainText.join('') })
  }
}

export default convertNotionToMd
