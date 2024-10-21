import { js2xml } from 'xml-js'

export default function (json: object, options = { compact: true, spaces: 4 }) {
  return js2xml(json, options)
}
