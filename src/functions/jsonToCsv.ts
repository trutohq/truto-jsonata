import { Parser } from '@json2csv/plainjs'
import { castArray, compact, isEmpty } from 'lodash-es'

export default function jsonToCsv(
  json: Record<string, unknown>[],
  options: Record<string, unknown>
) {
  const jsonArray = compact(castArray(json))
  if (isEmpty(jsonArray)) {
    return ''
  }

  const parser = new Parser(options)
  return parser.parse(jsonArray)
}
