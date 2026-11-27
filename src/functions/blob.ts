import { castArray } from 'lodash-es'
import { toJsonataBlob } from './toJsonataBlob'
import { unwrapNative } from './unwrapNative'

function blob(
  content: ArrayBuffer[] | string[] | Blob[] | ArrayBufferView[] | undefined,
  options: any
) {
  return toJsonataBlob(
    new Blob(
      castArray((content || '') as unknown as string).map(
        part => unwrapNative(part) as string
      ),
      options
    )
  )
}

export default blob
