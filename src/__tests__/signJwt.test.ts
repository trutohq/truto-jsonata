import { describe, expect, it } from 'vitest'
import signJwt from '../functions/signJwt'

describe('signJwt', () => {
	it('should sign a JWT with default options (HS256)', async () => {
		const payload = { sub: '1234567890', name: 'muleyyy' }
		const secret = 'sjdfosjdfsdfj'
		const token = await signJwt(payload, secret, {}, { alg: 'HS256' })
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
		expect(token).toMatch(/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\./)
	})

	it('should sign a JWT with custom headers and payload with exp/iat', async () => {
		const payload = { 
			sub: 'user1',
			exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
			iat: Math.floor(Date.now() / 1000)
		}
		const secret = 'sjdfosjdfsdfasasasasasasasj'
		const headers = { alg: 'HS256', kid: 'key1' }
		const token = await signJwt(payload, secret, {}, headers)
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
	})

	it('should sign a JWT with Google service account payload format', async () => {
		const payload = {
			"iss": "service-account@my-project.iam.gserviceaccount.com",
			"sub": "integration-admin@yourdomain.com",
			"scope": "https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/admin.directory.group https://www.googleapis.com/auth/admin.directory.group.member https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly https://www.googleapis.com/auth/admin.directory.orgunit.readonly",
			"aud": "https://oauth2.googleapis.com/token",
			"iat": 1746360000,
			"exp": 1746363600
		}
		const secret = 'test-secret'
		const headers = { alg: 'HS256' }
		const token = await signJwt(payload, secret, {}, headers)
		console.log(token)
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
	})

	it('should throw error for invalid payload', async () => {
		await expect(signJwt('invalid', 'secret', {}, { alg: 'HS256' })).rejects.toThrow('Payload must be a non-null object')
	})
}) 