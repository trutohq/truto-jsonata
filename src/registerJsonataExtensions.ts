import { Expression } from 'jsonata'
import { registerAiExtensions } from './presets/ai'
import { registerCoreExtensions } from './presets/core'
import { registerDataFormatsExtensions } from './presets/data-formats'
import { registerDatetimeExtensions } from './presets/datetime'
import { registerHtmlExtensions } from './presets/html'
import { registerMarkdownExtensions } from './presets/markdown'

export default function registerJsonataExtensions(expression: Expression) {
  registerCoreExtensions(expression)
  registerDatetimeExtensions(expression)
  registerMarkdownExtensions(expression)
  registerHtmlExtensions(expression)
  registerDataFormatsExtensions(expression)
  registerAiExtensions(expression)
  return expression
}
