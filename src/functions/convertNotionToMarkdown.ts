import { castArray, flatten, map, reject, repeat } from 'lodash-es'

const formatPlainText = (x: any) => {
  if (x) {
    if (x.href) {
      return `[${x.plain_text}](${
        x.href.startsWith('/') ? `https://www.notion.so${x.href}` : x.href
      })`
    }
    const isBold = x.annotations?.bold
    const isItalic = x.annotations?.italic
    const isStrikethrough = x.annotations?.strikethrough
    const isUnderline = x.annotations?.underline
    const isCode = x.annotations?.code
    let textToReturn = x.plain_text
    if (isCode) {
      textToReturn = `\`${textToReturn}\``
    }
    if (isBold) {
      textToReturn = `**${textToReturn}**`
    }
    if (isItalic) {
      textToReturn = `_${textToReturn}_`
    }
    if (isUnderline) {
      textToReturn = `_${textToReturn}_`
    }
    if (isStrikethrough) {
      textToReturn = `~~${textToReturn}~~`
    }
    return textToReturn
  }
}

const convertNotionToMd = function (block: any, level = 1) {
  const n = '\n\n'
  const data = block[block.type]
  const plainText = data.rich_text
    ? // @ts-ignore
      data?.rich_text.map(formatPlainText)
    : []
  // @ts-ignore
  const caption = data?.caption ? data.caption.map(x => x?.plain_text) : []
  let childData = ''
  switch (block.type) {
    case 'bookmark':
      return `[${data.url}](data.url)${n}`
    case 'bulleted_list_item':
      childData = map(block.children, child =>
        convertNotionToMd(child, level + 1)
      ).join(repeat('\t', level))
      return (
        `- ${plainText.join('')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    case 'numbered_list_item':
      childData = map(block.children, child =>
        convertNotionToMd(child, level + 1)
      ).join(repeat('\t', level))
      return (
        `${block.number}. ${plainText.join('')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    case 'quote':
    case 'callout':
      return `> ${plainText.join('')}${n}`
    case 'code':
      return `\`\`\`${data.language}\n${plainText}\n\`\`\`${n}`
    case 'divider':
      return `---${n}`
    case 'embed':
      return `[${caption.length ? caption : 'Embed'}](${data.url})${n}`
    case 'equation':
      return data.expression
    case 'paragraph':
      return plainText.join('') + n
    case 'video':
    case 'pdf':
    case 'file':
      return `[${caption.length ? caption : 'File'}](${
        data.file ? data.file.url : data.external ? data.external.url : ''
      })${n}`
    case 'heading_1':
      return `# ${plainText.join('')}${n}`
    case 'heading_2':
      return `## ${plainText.join('')}${n}`
    case 'heading_3':
      return `### ${plainText.join('')}${n}`
    case 'heading_4':
      return `#### ${plainText.join('')}${n}`
    case 'heading_5':
      return `##### ${plainText.join('')}${n}`
    case 'heading_6':
      return `###### ${plainText.join('')}${n}`
    case 'image':
      return `![${caption.length ? caption : 'Image'}](${
        data.file ? data.file.url : data.external ? data.external.url : ''
      })${n}`
    case 'table':
      if (block.children) {
        const firstChild = block.children[0]
        const remainingChildren = block.children.slice(1)
        const header = `| ${firstChild.table_row.cells
          .map((x: any) => x.map((y: any) => formatPlainText(y)).join(''))
          .join(' | ')} |\n`
        const divider = `|${repeat('---|', data.table_width)}\n`
        const rows = remainingChildren
          .map((row: any) => {
            return `| ${row.table_row.cells
              .map((x: any) => x.map((y: any) => formatPlainText(y)).join(''))
              .join(' | ')} |`
          })
          .join('\n')
        return `${header}${divider}${rows}${n}`
      }
      return `Table as CSV\n`
    case 'table_row':
      return `| ${data.cells
        .map((x: any) => x.map((y: any) => formatPlainText(y)).join(''))
        .join(' | ')} |\n`
    case 'to_do':
      childData = map(block.children, child =>
        convertNotionToMd(child, level + 1)
      ).join(repeat('\t', level))
      return (
        `- [${data.checked ? 'X' : ' '}] ${plainText.join('')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    default:
      childData = map(block.children, child => convertNotionToMd(child)).join(
        ''
      )
      return plainText.join('') + n + childData
  }
}

const resolveChildren = function (block: any, blocks: any) {
  if (!block.has_children) {
    return block
  }
  const children = blocks.filter((x: any) => x.parent_id === block.id)
  return {
    ...block,
    children: children.map((child: any) => resolveChildren(child, blocks)),
  }
}

const numberOrderedLists = function (blocks: any) {
  let number = 0
  return blocks.map((block: any) => {
    if (block.type !== 'numbered_list_item') {
      number = 0
      return block
    } else {
      if (block.children) {
        block.children = numberOrderedLists(block.children)
      }
      return {
        ...block,
        number: ++number,
      }
    }
  })
}

const insertNewLinesBetweenLists = function (blocks: any) {
  const listBlocks = ['to_do', 'numbered_list_item', 'bulleted_list_item']
  return flatten(
    blocks.map((block: any, index: number) => {
      const nextBlock = blocks[index + 1]
      const nextBlockType = nextBlock?.type
      if (
        listBlocks.includes(block.type) &&
        !listBlocks.includes(nextBlockType)
      ) {
        return [
          block,
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [],
              color: 'default',
            },
          },
        ]
      }
      return block
    })
  )
}

const convertNotionToMarkdown = function (blocks: any) {
  const arrayBlocks = insertNewLinesBetweenLists(castArray(blocks))
  const parentBlocks = reject(
    arrayBlocks,
    (block: any) => block.parent?.type === 'block_id'
  )
  const blocksWithChildren = numberOrderedLists(
    parentBlocks.map((block: any) => {
      return resolveChildren(block, arrayBlocks)
    })
  )
  return blocksWithChildren
    .map((block: any) => convertNotionToMd(block))
    .join('')
}

export default convertNotionToMarkdown
