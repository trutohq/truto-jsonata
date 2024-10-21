import { describe, expect, it } from 'vitest'
import sign from '../functions/sign'

describe('sign', async () => {
  it('should return the SHA-256 HMAC of a string in hex format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-256', 'secret', 'hex')
    expect(hash).toBe(
      '82ce0d2f821fa0ce5447b21306f214c99240fecc6387779d7515148bbdd0c415',
    )
  })

  it('should return the SHA-256 HMAC of a string in base64 format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-256', 'secret', 'base64')
    expect(hash).toBe('gs4NL4IfoM5UR7ITBvIUyZJA/sxjh3eddRUUi73QxBU=')
  })

  it('should return the SHA-256 HMAC of a string in base64-urlSafe format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-256', 'secret', 'base64-urlSafe')
    expect(hash).toBe('gs4NL4IfoM5UR7ITBvIUyZJA_sxjh3eddRUUi73QxBU')
  })

  it('should return the SHA-512 HMAC of a string in base64 format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-512', 'secret', 'base64')
    expect(hash).toBe(
      'bR0YbsSB8+fR9gTnp0CBFApxOo2LrFaOJX7Rr5WY9k8n8fS9rw7fodMWoad0BkfbOOfegud5QsuYxKCKTRfonw==',
    )
  })

  it('should return the SHA-512 HMAC of a string in base64-urlSafe format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-512', 'secret', 'base64-urlSafe')
    expect(hash).toBe(
      'bR0YbsSB8-fR9gTnp0CBFApxOo2LrFaOJX7Rr5WY9k8n8fS9rw7fodMWoad0BkfbOOfegud5QsuYxKCKTRfonw',
    )
  })

  it('should return the SHA-512 HMAC of a string in hex format', async () => {
    const text = 'Hello World'
    const hash = await sign(text, 'SHA-512', 'secret', 'hex')
    expect(hash).toBe(
      '6d1d186ec481f3e7d1f604e7a74081140a713a8d8bac568e257ed1af9598f64f27f1f4bdaf0edfa1d316a1a7740647db38e7de82e77942cb98c4a08a4d17e89f',
    )
  })
})
