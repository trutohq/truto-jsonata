import { unwrapBlob } from './unwrapNative'

async function getArrayBuffer(file?: unknown) {
  const blob = unwrapBlob(file)
  return blob ? await blob.arrayBuffer() : undefined
}

export default getArrayBuffer
