import { describe, expect, it } from 'vitest'
import signJwt from '../functions/signJwt'

describe('signJwt', () => {
	it('should sign a JWT with default options (HS256)', async () => {
		const payload = { sub: '1234567890', name: 'muleyyy' }
		const secret = 'sjdfosjdfsdfj'
		const token = await signJwt(payload, secret)
        console.log(token)
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
		expect(token).toMatch(/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\./)
	})

	it('should sign a JWT with custom options (expiresIn, header.kid)', async () => {
		const payload = { sub: 'user1' }
		const secret = 'sjdfosjdfsdfasasasasasasasj'
		const options = { algorithm: 'HS256', expiresIn: '1h', header: { kid: 'key1' } }
		const token = await signJwt(payload, secret, options)
        console.log(token)
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
	})

	it('should throw error for invalid payload', async () => {
		await expect(signJwt('invalid', 'secret')).rejects.toThrow('Payload must be a non-null object')
	})
}) 