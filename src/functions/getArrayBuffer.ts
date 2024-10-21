async function getArayBuffer(file?: Blob) {
  return file ? await file.arrayBuffer() : undefined
}

export default getArayBuffer
