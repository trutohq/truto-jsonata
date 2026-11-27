import { NATIVE_READABLE_STREAM, NATIVE_READABLE_STREAM_READER } from './unwrapNative'

// Members are own but not enumerable: JSONata 2.2 can read them, while `&`,
// conditions and key lists see an empty object, as JSONata 2.0 saw the raw
// stream and reader (no own keys).
function hidden(
  target: object,
  members: Record<string, PropertyDescriptor>
) {
  for (const [key, descriptor] of Object.entries(members)) {
    Object.defineProperty(target, key, { ...descriptor, enumerable: false })
  }
  return target
}

export function toJsonataReadableStream(stream: ReadableStream) {
  const value = hidden(
    {},
    {
      locked: { get: () => stream.locked },
      cancel: { value: (reason?: unknown) => stream.cancel(reason) },
      tee: {
        value: () =>
          stream.tee().map(branch => toJsonataReadableStream(branch)),
      },
      getReader: {
        value: () => {
          const reader = stream.getReader()
          const wrapped = hidden(
            {},
            {
              read: { value: () => reader.read() },
              releaseLock: { value: () => reader.releaseLock() },
              cancel: { value: (reason?: unknown) => reader.cancel(reason) },
              closed: { value: reader.closed },
            }
          )
          // a symbol key: Object.entries in hidden() would skip it
          Object.defineProperty(wrapped, NATIVE_READABLE_STREAM_READER, {
            value: reader,
            enumerable: false,
          })
          return wrapped
        },
      },
    }
  )
  Object.defineProperty(value, NATIVE_READABLE_STREAM, {
    value: stream,
    enumerable: false,
  })
  return value
}
