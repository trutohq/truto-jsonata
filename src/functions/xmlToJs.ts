import { xml2js } from 'xml-js'

export default function xmlToJs(
  xml: string,
  options = { compact: true, spaces: 4 }
) {
  return xml2js(xml, options) as Record<string, unknown>
}
