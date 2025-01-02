import { isFunction } from 'lodash-es'

async function getArrayBuffer(file?: Blob) {
  return file && isFunction(file.arrayBuffer) ? await file.arrayBuffer() : undefined
}
export default getArrayBuffer
