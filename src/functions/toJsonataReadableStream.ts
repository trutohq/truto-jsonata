import { NATIVE_READABLE_STREAM, NATIVE_READABLE_STREAM_READER } from './unwrapNative'

export function toJsonataReadableStream(stream: ReadableStream) {
  const value = {
    locked: stream.locked,
    cancel: (reason?: unknown) => stream.cancel(reason),
    tee: () => stream.tee().map(branch => toJsonataReadableStream(branch)),
    getReader: () => {
      const reader = stream.getReader()
      const wrappedReader = {
        read: () => reader.read(),
        releaseLock: () => reader.releaseLock(),
        cancel: (reason?: unknown) => reader.cancel(reason),
        closed: reader.closed,
      }
      Object.defineProperty(wrappedReader, NATIVE_READABLE_STREAM_READER, {
        value: reader,
        enumerable: false,
      })
      return wrappedReader
    },
  }
  Object.defineProperty(value, NATIVE_READABLE_STREAM, {
    value: stream,
    enumerable: false,
  })
  return value
}
