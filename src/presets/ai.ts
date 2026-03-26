import { Expression } from 'jsonata'
import generateEmbeddingsCohere from '../functions/generateEmbeddingsCohere'
import { recursiveCharacterTextSplitter } from '../functions/recursiveCharacterTextSplitter'

export function registerAiExtensions(expression: Expression): Expression {
  expression.registerFunction(
    'generateEmbeddingsCohere',
    generateEmbeddingsCohere
  )
  expression.registerFunction(
    'recursiveCharacterTextSplitter',
    recursiveCharacterTextSplitter
  )
  return expression
}
