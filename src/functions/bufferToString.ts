async function bufferToString(
  value: Buffer | ReadableStream,
  encoding: BufferEncoding | undefined
) {
  if (value instanceof ReadableStream) {
    const chunks = []
    for await (const chunk of value) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)
    return buffer.toString(encoding)
  }
  return value.toString(encoding)
}

export default bufferToString
