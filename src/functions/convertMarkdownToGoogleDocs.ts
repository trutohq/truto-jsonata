import { concat, each, find, get, isEmpty, isEqual, reduce } from 'lodash'
import { Lexer, Token } from 'marked'
import decodeHtmlEntities from './decodeHtmlEntities'
import insertBetween from './insertBetween'

const parseMarkedTokenToGoogleDocsRequest = (
  tokens: Token[],
  acc = {
    counter: 1,
    offset: 0,
    inserts: [] as Record<string, any>[],
    formats: [] as Record<string, any>[],
  },
  context = {
    level: 0,
  }
): {
  counter: number
  inserts: Record<string, any>[]
  formats: Record<string, any>[]
} => {
  return reduce(
    tokens,
    (acc, token) => {
      if (token.type === 'hr') {
        acc.inserts.push({
          insertText: {
            text: '\n\n',
            location: {
              index: acc.counter,
            },
          },
        })
        acc.counter += 2
        return acc
      }
      if (token.type === 'space') {
        const textToAdd = token.raw || '\n'
        acc.inserts.push({
          insertText: {
            text: textToAdd,
            location: {
              index: acc.counter,
            },
          },
        })
        acc.counter += textToAdd.length
        return acc
      }
      if (token.type === 'image') {
        acc.inserts.push({
          insertInlineImage: {
            uri: token.href,
            location: {
              index: acc.counter,
            },
          },
        })
        acc.counter += 1
        return acc
      }
      if (token.type === 'table') {
        acc.inserts.push({
          insertTable: {
            columns: token.header.length,
            rows: token.rows.length + 1,
            location: {
              index: acc.counter,
            },
          },
        })
        acc.counter += 4
        each([token.header, ...token.rows], (rowItems, index, arr) => {
          each(rowItems, item => {
            parseMarkedTokenToGoogleDocsRequest([item], acc, context)
            acc.counter += 2
          })
          if (index === arr.length - 1) {
            return
          }
          acc.counter += 1
        })
        acc.inserts.push({
          insertText: {
            text: '\n',
            location: {
              index: acc.counter,
            },
          },
        })
        acc.counter += 1
        return acc
      }
      const childTokens: undefined | Token[] = get(token, 'tokens')
      if (!isEmpty<Token[]>(childTokens)) {
        const start = acc.counter
        if (token.type === 'list_item') {
          if (context.level > 1) {
            acc.inserts.push({
              insertText: {
                text: '\t'.repeat(context.level - 1),
                location: {
                  index: acc.counter,
                },
              },
            })
            acc.offset += context.level - 1
            acc.counter += context.level - 1
          }
          parseMarkedTokenToGoogleDocsRequest(
            insertBetween(childTokens, [
              {
                type: 'space',
                raw: '\n',
              },
            ]),
            acc,
            context
          )
        } else {
          parseMarkedTokenToGoogleDocsRequest(childTokens, acc, context)
        }
        const end = acc.counter
        if (token.type === 'heading') {
          acc.formats.push({
            updateParagraphStyle: {
              paragraphStyle: {
                namedStyleType: `HEADING_${token.depth}`,
              },
              fields: '*',
              range: {
                startIndex: start - acc.offset,
                endIndex: end - acc.offset,
              },
            },
          })
          acc.inserts.push({
            insertText: {
              text: '\n',
              location: {
                index: acc.counter,
              },
            },
          })
          acc.counter += 1
        }
        if (token.type === 'em') {
          acc.formats.push({
            updateTextStyle: {
              textStyle: {
                italic: true,
              },
              fields: '*',
              range: {
                startIndex: start - acc.offset,
                endIndex: end - acc.offset,
              },
            },
          })
        }
        if (token.type === 'strong') {
          acc.formats.push({
            updateTextStyle: {
              textStyle: {
                bold: true,
              },
              fields: '*',
              range: {
                startIndex: start - acc.offset,
                endIndex: end - acc.offset,
              },
            },
          })
        }
        if (token.type === 'link') {
          acc.formats.push({
            updateTextStyle: {
              textStyle: {
                link: {
                  url: token.href,
                },
                underline: true,
                foregroundColor: {
                  color: {
                    rgbColor: {
                      red: 0.1,
                      green: 0.33,
                      blue: 0.8,
                    },
                  },
                },
              },
              fields: '*',
              range: {
                startIndex: start - acc.offset,
                endIndex: end - acc.offset,
              },
            },
          })
        }
        return acc
      }

      const childItems: undefined | Token[] = get(token, 'items')

      if (!isEmpty<Token[]>(childItems)) {
        const start = acc.counter
        parseMarkedTokenToGoogleDocsRequest(
          insertBetween(childItems, [
            {
              type: 'space',
              raw: '\n',
            },
          ]),
          acc,
          {
            level: context.level + 1,
          }
        )
        const end = acc.counter
        if (!context.level && token.type === 'list') {
          acc.formats = concat(
            {
              createParagraphBullets: {
                range: {
                  startIndex: start,
                  endIndex: end,
                },
                bulletPreset: token.ordered
                  ? 'NUMBERED_DECIMAL_ALPHA_ROMAN'
                  : 'BULLET_DISC_CIRCLE_SQUARE',
              },
            },
            acc.formats
          )
        }
        return acc
      }
      const text: undefined | string = get(token, 'text')
      if (!text) {
        return acc
      }
      const textToInsert = decodeHtmlEntities(text)
      acc.inserts.push({
        insertText: {
          text: textToInsert,
          location: {
            index: acc.counter,
          },
        },
      })
      acc.counter += textToInsert.length
      return acc
    },
    acc
  )
}

const convertMarkdownToGoogleDocs = (text: string, currentCounter = 1) => {
  const tokens = Lexer.lex(text)
  const parsedTokens = parseMarkedTokenToGoogleDocsRequest(tokens, {
    counter: currentCounter,
    formats: [],
    inserts: [],
    offset: 0,
  })
  const formats = parsedTokens.formats
  const mergedFormats = reduce(
    formats,
    (acc, format) => {
      const range = get(format, 'updateTextStyle.range')
      if (!range) {
        acc.push(format)
      } else {
        const existingFormat = find(acc, f => {
          const r = get(f, 'updateTextStyle.range')
          return isEqual(r, range)
        })
        if (existingFormat) {
          existingFormat.updateTextStyle.textStyle = {
            ...existingFormat.updateTextStyle.textStyle,
            ...format.updateTextStyle.textStyle,
          }
        } else {
          acc.push(format)
        }
      }
      return acc
    },
    [] as Record<string, any>[]
  )
  return {
    requests: [...parsedTokens.inserts, ...mergedFormats],
  }
}

export default convertMarkdownToGoogleDocs
