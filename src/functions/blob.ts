import { castArray } from 'lodash'

function blob(
  content: ArrayBuffer[] | string[] | Blob[] | ArrayBufferView[] | undefined,
  options: any
) {
  return new Blob(castArray((content || '') as unknown as string), options)
}

export default blob
