import { Lexer, Token } from 'marked'
import {
  concat,
  filter,
  flattenDeep,
  get,
  groupBy,
  isEmpty,
  isString,
  join,
  map,
  reduce,
} from 'lodash-es'

const parseMarkedTokenToSlackRequest = (
  tokens: Token[],
  acc: any[] = []
): any[] => {
  return reduce(
    tokens,
    (acc, token) => {
      if (token.type === 'hr') {
        acc.push({
          type: 'divider',
        })
        return acc
      }
      if (token.type === 'space') {
        acc.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '\n',
          },
        })
        return acc
      }
      if (token.type === 'image') {
        acc.push({
          type: 'image',
          image_url: token.href,
          alt_text: token.text,
        })
        return acc
      }
      if (token.type === 'paragraph' || token.type === 'text') {
        const childTokens: undefined | Token[] = get(token, 'tokens')
        let childData = []
        if (childTokens) {
          childData = parseMarkedTokenToSlackRequest(childTokens)
        } else {
          acc.push(token.raw)
          return acc
        }
        const childDataGroupedByType = groupBy(childData, x =>
          isString(x) ? 'text' : 'block'
        )
        if (!isEmpty(childDataGroupedByType.text)) {
          acc.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: join(childDataGroupedByType.text, ''),
            },
          })
        }
        if (!isEmpty(childDataGroupedByType.block)) {
          acc = concat(acc, childDataGroupedByType.block)
        }
        return acc
      }
      if (token.type === 'heading') {
        acc.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: token.text,
            emoji: true,
          },
        })
        return acc
      }
      if (token.type === 'list') {
        const items = map(token.items, item => {
          const childTokens: undefined | Token[] = get(item, 'tokens')
          let childData = []
          if (childTokens) {
            childData = parseMarkedTokenToSlackRequest(childTokens)
          }
          return childData
        })

        const listString = join(
          filter(flattenDeep(items), x => !!get(x, 'text.text')).map(
            (x, index) =>
              `${token.ordered ? `${index + 1}.` : '•'} ${get(x, 'text.text')}`
          ),
          '\n'
        )

        acc.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: listString,
          },
        })
        return acc
      }
      if (token.type === 'strong') {
        acc.push(`*${token.text}*`)
        return acc
      }
      if (token.type === 'link') {
        acc.push(`<${token.href}|${token.text}>`)
        return acc
      }
      if (token.type === 'blockquote') {
        acc.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: token.raw,
          },
        })
        return acc
      }
      if (token.type === 'code') {
        acc.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: token.raw,
          },
        })
        return acc
      }
      acc.push(token.raw)
      return acc
    },
    acc
  )
}

const convertMarkdownToSlack = (text: string) => {
  const tokens = Lexer.lex(text)
  const parsedTokens = parseMarkedTokenToSlackRequest(tokens)
  return filter(parsedTokens, x => !isString(x))
}

export default convertMarkdownToSlack
