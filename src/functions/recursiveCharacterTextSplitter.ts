import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { isPlainObject, isArray, isString, toString } from 'lodash-es'

export async function recursiveCharacterTextSplitter(
  text: string | object | any[],
  options = { chunkSize: 200, chunkOverlap: 60 }
): Promise<string[]> {
  let textToSplit: string

  if (isString(text)) {
    textToSplit = text
  } else if (isPlainObject(text) || isArray(text)) {
    textToSplit = JSON.stringify(text, null, 2)
  } else {
    textToSplit = toString(text)
  }

  const splitter = new RecursiveCharacterTextSplitter(options)
  return splitter.splitText(textToSplit)
}
