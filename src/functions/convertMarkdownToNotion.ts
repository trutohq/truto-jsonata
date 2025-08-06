import {
  compact,
  concat,
  each,
  flattenDeep,
  get,
  groupBy,
  isEmpty,
  map,
  reduce,
  set,
} from 'lodash-es'
import { Lexer, Token } from 'marked'
import decodeHtmlEntities from './decodeHtmlEntities'
import insertBetween from './insertBetween'

const parseMarkedTokenToNotionRequest = (
  tokens: Token[],
  acc: any[] = []
): any[] => {
  return reduce(
    tokens,
    (acc, token) => {
      const childTokens: undefined | Token[] =
        token.type === 'blockquote'
          ? get(token, 'tokens[0].tokens')
          : get(token, 'tokens')
      let childData = []
      if (childTokens) {
        childData = parseMarkedTokenToNotionRequest(childTokens)
      }
      if (token.type === 'hr') {
        acc.push({
          type: 'divider',
          divider: {},
        })
        return acc
      }
      if (token.type === 'space') {
        acc.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '\n',
                },
              },
            ],
          },
        })
        return acc
      }
      if (token.type === 'image') {
        acc.push({
          type: 'image',
          image: {
            type: 'external',
            external: {
              url: token.href,
            },
          },
        })
        return acc
      }
      if (token.type === 'paragraph') {
        const groupedChildData = groupBy(childData, x =>
          x.type === 'image' ? 'image' : 'other'
        )
        if (!isEmpty(groupedChildData.other)) {
          acc.push({
            type: 'paragraph',
            paragraph: {
              rich_text: groupedChildData.other,
            },
          })
        }
        if (!isEmpty(groupedChildData.image)) {
          acc = concat(acc, groupedChildData.image)
        }
        return acc
      }
      if (token.type === 'heading') {
        acc.push({
          type: `heading_${token.depth}`,
          [`heading_${token.depth}`]: {
            rich_text: childData,
          },
        })
        return acc
      }
      if (token.type === 'code') {
        const textSplitByNewLine = token.text.split('\n')
        const chunksOfChunks = compact(
          map(textSplitByNewLine, chunk => chunkText(chunk))
        )
        const chunksWithNewLines = flattenDeep(
          insertBetween(
            map(chunksOfChunks, chunk => {
              return map(chunk, _chunk => ({
                type: 'text',
                text: {
                  content: _chunk,
                },
              }))
            }),
            {
              type: 'text',
              text: {
                content: '\n\n',
              },
            }
          )
        )
        acc.push({
          type: 'code',
          code: {
            rich_text: chunksWithNewLines,
            language: token.lang || 'plain text',
          },
        })
        return acc
      }
      if (token.type === 'table') {
        const table = {
          type: 'table',
          table: {
            table_width: token.header.length,
            has_column_header: true,
            has_row_header: false,
            children: [] as any[],
          },
        }
        const headerChildren = parseMarkedTokenToNotionRequest(token.header)
        table.table.children.push({
          type: 'table_row',
          table_row: {
            cells: headerChildren.map(x => [x]),
          },
        })
        each(token.rows, row => {
          const rowChildren = map(row, rowCell =>
            parseMarkedTokenToNotionRequest([rowCell])
          )
          table.table.children.push({
            type: 'table_row',
            table_row: {
              cells: rowChildren.map(x => x),
            },
          })
        })
        acc.push(table)
        return acc
      }
      if (token.type === 'list') {
        const listType = token.items[0].task
          ? 'to_do'
          : token.ordered
          ? 'numbered_list_item'
          : 'bulleted_list_item'
        each(token.items, item => {
          const itemChildren = parseMarkedTokenToNotionRequest(item.tokens)
          const groupedItemChildren = groupBy(itemChildren, x =>
            x.type === 'text' ? 'other' : 'list'
          )
          acc.push({
            type: listType,
            [listType]: {
              rich_text: groupedItemChildren.other,
              children: groupedItemChildren.list,
              ...(listType === 'to_do'
                ? {
                    checked: item.checked,
                  }
                : {}),
            },
          })
        })
      }
      if (token.type === 'em') {
        each(childData, child => {
          set(child, ['annotations', 'italic'], true)
        })
        acc = concat(acc, childData)
        return acc
      }
      if (token.type === 'strong') {
        each(childData, child => {
          set(child, ['annotations', 'bold'], true)
        })
        acc = concat(acc, childData)
        return acc
      }
      if (token.type === 'link') {
        each(childData, child => {
          if (child.text) {
            set(child, ['text', 'link', 'url'], token.href)
          }
        })
        acc = concat(acc, childData)
        return acc
      }
      if (token.type === 'blockquote') {
        acc.push({
          type: 'callout',
          callout: {
            rich_text: childData,
          },
        })
        return acc
      }
      if (!isEmpty(childData)) {
        acc = concat(acc, childData)
        return acc
      }
      const text: undefined | string = get(token, 'text')
      if (!text) {
        return acc
      }
      const textToInsert = decodeHtmlEntities(text)
      // chunk the text into 2000 character chunks, should handle emojis and multi-byte characters
      const textSplitByNewLine = textToInsert.split('\n')
      const chunksOfChunks = compact(
        map(textSplitByNewLine, chunk => chunkText(chunk))
      )
      const chunksWithNewLines = flattenDeep(
        insertBetween(
          map(chunksOfChunks, chunk => {
            return map(chunk, _chunk => ({
              type: 'text',
              text: {
                content: _chunk,
              },
              ...(token.type === 'codespan'
                ? {
                    annotations: {
                      code: true,
                    },
                  }
                : {}),
            }))
          }),
          {
            type: 'text',
            text: {
              content: '\n',
            },
          }
        )
      )
      each(chunksWithNewLines, chunk => {
        acc.push(chunk)
      })
      return acc
    },
    acc
  )
}

const chunkText = (text: string, numChars = 2000) => {
  return text.match(new RegExp(`.{1,${numChars}}`, 'g'))
}

const convertMarkdownToNotion = (text: string) => {
  const tokens = Lexer.lex(text)
  const parsedTokens = parseMarkedTokenToNotionRequest(tokens)
  return {
    children: parsedTokens,
  }
}

export default convertMarkdownToNotion
