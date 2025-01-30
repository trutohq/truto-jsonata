import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export function recursiveCharacterTextSplitter(
  text: string,
  options = { chunkSize: 200, chunkOverlap: 60 }
) {
  const splitter = new RecursiveCharacterTextSplitter(options)
  return splitter.splitText(text)
}
