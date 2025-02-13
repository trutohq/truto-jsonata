async function teeStream(stream: ReadableStream) {
  return stream.tee()
}
export default teeStream
