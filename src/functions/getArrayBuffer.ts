async function getArrayBuffer(file?: Blob) {
  return file ? await file.arrayBuffer() : undefined
}

export default getArrayBuffer
