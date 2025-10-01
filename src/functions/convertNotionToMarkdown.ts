import { castArray, flatten, join, map, reject, repeat } from 'lodash-es'

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

const convertNotionToMd = function (
  block: any,
  level = 1,
  linkChildPages = false
) {
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
      childData = join(
        map(block.children, child =>
          convertNotionToMd(child, level + 1, linkChildPages)
        ),
        repeat('\t', level)
      )
      return (
        `- ${join(plainText, '')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    case 'numbered_list_item':
      childData = join(
        map(block.children, child =>
          convertNotionToMd(child, level + 1, linkChildPages)
        ),
        repeat('\t', level)
      )
      return (
        `${block.number}. ${join(plainText, '')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    case 'quote':
    case 'callout':
      return `> ${join(plainText, '')}${n}`
    case 'code':
      return `\`\`\`${data.language}\n${plainText}\n\`\`\`${n}`
    case 'divider':
      return `---${n}`
    case 'embed':
      return `[${caption.length ? caption : 'Embed'}](${data.url})${n}`
    case 'equation':
      return data.expression
    case 'paragraph':
      return join(plainText, '') + n
    case 'video':
    case 'pdf':
    case 'file':
      return `[${caption.length ? caption : 'File'}](${
        data.file ? data.file.url : data.external ? data.external.url : ''
      })${n}`
    case 'heading_1':
      return `# ${join(plainText, '')}${n}`
    case 'heading_2':
      return `## ${join(plainText, '')}${n}`
    case 'heading_3':
      return `### ${join(plainText, '')}${n}`
    case 'heading_4':
      return `#### ${join(plainText, '')}${n}`
    case 'heading_5':
      return `##### ${join(plainText, '')}${n}`
    case 'heading_6':
      return `###### ${join(plainText, '')}${n}`
    case 'image':
      return `![${caption.length ? caption : 'Image'}](${
        data.file ? data.file.url : data.external ? data.external.url : ''
      })${n}`
    case 'child_page':
      if (linkChildPages) {
        // Generate a link to the child page instead of including its content
        const pageTitle = data.title || 'Untitled Page'
        const pageUrl = `https://www.notion.so/${block.id.replace(/-/g, '')}`
        return `[${pageTitle}](${pageUrl})${n}`
      } else {
        // Include the child page content as before (if children exist)
        childData = join(
          map(block.children, child =>
            convertNotionToMd(child, level, linkChildPages)
          ),
          ''
        )
        return (data.title || 'Untitled Page') + n + childData
      }
    case 'table':
      if (block.children) {
        const firstChild = block.children[0]
        const remainingChildren = block.children.slice(1)
        const header = `| ${join(
          firstChild.table_row.cells.map((x: any) =>
            join(
              x.map((y: any) => formatPlainText(y)),
              ''
            )
          ),
          ' | '
        )} |\n`
        const divider = `|${repeat('---|', data.table_width)}\n`
        const rows = join(
          remainingChildren.map((row: any) => {
            return `| ${join(
              row.table_row.cells.map((x: any) =>
                join(
                  x.map((y: any) => formatPlainText(y)),
                  ''
                )
              ),
              ' | '
            )} |`
          }),
          '\n'
        )
        return `${header}${divider}${rows}${n}`
      }
      return `Table as CSV\n`
    case 'table_row':
      return `| ${join(
        data.cells.map((x: any) =>
          join(
            x.map((y: any) => formatPlainText(y)),
            ''
          )
        ),
        ' | '
      )} |\n`
    case 'to_do':
      childData = join(
        map(block.children, child =>
          convertNotionToMd(child, level + 1, linkChildPages)
        ),
        repeat('\t', level)
      )
      return (
        `- [${data.checked ? 'X' : ' '}] ${join(plainText, '')}\n` +
        (childData ? `${repeat('\t', level)}${childData}` : '')
      )
    default:
      childData = join(
        map(block.children, child =>
          convertNotionToMd(child, level, linkChildPages)
        ),
        ''
      )
      return join(plainText, '') + n + childData
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

const convertNotionToMarkdown = function (blocks: any, linkChildPages = false) {
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
  return join(
    blocksWithChildren.map((block: any) =>
      convertNotionToMd(block, 1, linkChildPages)
    ),
    ''
  )
}

export default convertNotionToMarkdown
