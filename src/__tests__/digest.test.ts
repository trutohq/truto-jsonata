import { describe, expect, it } from 'vitest'
import digest from '../functions/digest'

describe('digest', async () => {
  it('should return the SHA-256 hash of a string in hex format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-256', 'hex')
    expect(hash).toBe(
      'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
    )
  })

  it('should return the SHA-256 hash of a string in base64 format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-256', 'base64')
    expect(hash).toBe('pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=')
  })

  it('should return the SHA-256 hash of a string in base64-urlSafe format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-256', 'base64-urlSafe')
    expect(hash).toBe('pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4')
  })

  it('should return the SHA-512 hash of a string in base64 format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-512', 'base64')
    expect(hash).toBe(
      'LHT9F+2v2A6ER7DUZ0HuJDt+t03SFJoKsbkkb7MDgvJ+hT2FhXGeDmfL2g2qj1FnEGRhXWRa4nrLFb+xRH9Fmw=='
    )
  })

  it('should return the SHA-512 hash of a string in base64-urlSafe format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-512', 'base64-urlSafe')
    expect(hash).toBe(
      'LHT9F-2v2A6ER7DUZ0HuJDt-t03SFJoKsbkkb7MDgvJ-hT2FhXGeDmfL2g2qj1FnEGRhXWRa4nrLFb-xRH9Fmw'
    )
  })

  it('should return the SHA-512 hash of a string in hex format', async () => {
    const text = 'Hello World'
    const hash = await digest(text, 'SHA-512', 'hex')
    expect(hash).toBe(
      '2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b'
    )
  })

  it('should return the MD5 hash of a string in hex format', async () => {
    const text = '42'
    const hash = await digest(text, 'MD5', 'hex')
    expect(hash).toBe('a1d0c6e83f027327d8461063f4ac58a6')
  })

  it('should return the MD5 hash of a string in base64 format', async () => {
    const text = '42'
    const hash = await digest(text, 'MD5', 'base64')
    expect(hash).toBe('odDG6D8CcyfYRhBj9KxYpg==')
  })

  it('should return the MD5 hash of a string in base64-urlSafe format', async () => {
    const text = '42'
    const hash = await digest(text, 'MD5', 'base64-urlSafe')
    expect(hash).toBe('odDG6D8CcyfYRhBj9KxYpg')
  })

  it('should return the MD5 hash (case insensitive) of a string in hex format', async () => {
    const text = '42'
    const hash = await digest(text, 'md5', 'hex')
    expect(hash).toBe('a1d0c6e83f027327d8461063f4ac58a6')
  })
})
