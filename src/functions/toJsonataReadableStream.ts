import { NATIVE_READABLE_STREAM, NATIVE_READABLE_STREAM_READER } from './unwrapNative'

export type JsonataReadableStream = ReturnType<typeof toJsonataReadableStream>

export function toJsonataReadableStream(stream: ReadableStream) {
  return {
    locked: stream.locked,
    cancel: (reason?: unknown) => stream.cancel(reason),
    tee: () => stream.tee().map(branch => toJsonataReadableStream(branch)),
    getReader: () => {
      const reader = stream.getReader()
      return {
        read: () => reader.read(),
        releaseLock: () => reader.releaseLock(),
        cancel: (reason?: unknown) => reader.cancel(reason),
        closed: reader.closed,
        [NATIVE_READABLE_STREAM_READER]: reader,
      }
    },
    [NATIVE_READABLE_STREAM]: stream,
  }
}
