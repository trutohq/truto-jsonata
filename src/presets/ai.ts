import { Expression } from 'jsonata'
import registerHostFunction from '../functions/registerHostFunction'
import generateEmbeddingsCohere from '../functions/generateEmbeddingsCohere'
import { recursiveCharacterTextSplitter } from '../functions/recursiveCharacterTextSplitter'

export function registerAiExtensions(expression: Expression): Expression {
  registerHostFunction(
    expression,
    'generateEmbeddingsCohere',
    generateEmbeddingsCohere
  )
  registerHostFunction(
    expression,
    'recursiveCharacterTextSplitter',
    recursiveCharacterTextSplitter
  )
  return expression
}
