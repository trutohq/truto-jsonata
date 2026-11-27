import { File } from 'buffer'
import getArrayBuffer from '../functions/getArrayBuffer'
import { toJsonataBlob } from '../functions/toJsonataBlob'
import { unwrapArrayBuffer } from '../functions/unwrapNative'
import { describe, expect, it } from 'vitest'
import { evalTruto } from './helpers/jsonataEval'

describe('getArrayBuffer', () => {
  it('should return an ArrayBuffer from a normal blob string', async () => {
    const testBlob = new Blob(['Hello, world!'], { type: 'text/plain' })
    const arrayBuffer = unwrapArrayBuffer(await getArrayBuffer(testBlob))

    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
    if (arrayBuffer) {
      expect(arrayBuffer.byteLength).toBe(testBlob.size)
    }
  })

  it('should return an ArrayBuffer from a file', async () => {
    const file = new File(['Hello, world!'], 'hello.txt', {
      type: 'text/plain',
    })
    const arrayBuffer = unwrapArrayBuffer(await getArrayBuffer(file))
    if (arrayBuffer) {
      expect(arrayBuffer.byteLength).toBe(file.size)
    }
    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
  })

  it('unwraps jsonata-safe blobs from $blob', async () => {
    const wrapped = toJsonataBlob(new Blob(['Hello, world!'], { type: 'text/plain' }))
    const result = await getArrayBuffer(wrapped)
    // wrapped so the expression can read byteLength, as on the 2.0 native
    expect(result?.byteLength).toBe(13)
    const arrayBuffer = unwrapArrayBuffer(result)
    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
    expect(arrayBuffer?.byteLength).toBe(13)
  })

  it('reads a Response or Request body, as 2.0 did', async () => {
    expect(await evalTruto('$getArrayBuffer(r).byteLength', { r: new Response('hello') })).toBe(5)
    expect(
      await evalTruto('$getArrayBuffer(q).byteLength', {
        q: new Request('https://a.example', { method: 'POST', body: 'hello' }),
      })
    ).toBe(5)
    expect(await evalTruto('$getArrayBuffer(o)', { o: { a: 1 } })).toBeUndefined()
  })

  it('should return undefined when file is of not blob type', async () => {
    // @ts-ignore
    const arrayBuffer = await getArrayBuffer('Hello World!')
    expect(arrayBuffer).toBeUndefined()
  })
})
