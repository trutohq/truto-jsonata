import { describe, expect, it } from 'vitest'
import signJwt from '../functions/signJwt'

describe('signJwt', () => {
	it('should sign a JWT with default options (HS256)', async () => {
		const payload = { sub: '1234567890', name: 'muleyyy' }
		const secret = 'sjdfosjdfsdfj'
		const token = await signJwt(payload, secret, { alg: 'HS256' })
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
		const token = await signJwt(payload, secret,  headers)
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
		const token = await signJwt(payload, secret, headers)
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
	})

	it('should normalize and sign with PEM key containing escaped newlines (RS256)', async () => {
		const escapedPrivateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9SYzoC6SeLdLG\nM0Fvrs7CzDtuXV2RHS6k6k3Es6NOB3YInu/kVdY98WfTtIR8xr6WFu0BkCJguHvu\n+onQ1iDPSJpeBWcoSZq9WDiKunh8avjO9X+x04P8dhVaxTWAbrg592lbB6zgWzxH\nVzNdagfMkfCcqcZ+uSybQAnQFDPdh/NFcCsMl7tjRQpwwJhuWsgGKL/zBV8V4Ynh\nbZ01iYZGaf9mBNsTWjGRElLUUVsQNIsTJsgKOjWbzudlfHwelfZga2JvvU3Wtz8A\nZwsqtUyjhS7vDkr+QTbFeHPGCajCDJIS4Yu1Jy34fphitpt2HMQdpbgHgJg54XJm\n/orT0ESrAgMBAAECggEAA6926t2vKtVBkVJWJ9KDfA916MQwmi6zRcq6EOZee5px\nleFiUlPJhBM7LkgJfFRySYHQw4MG6FMvNovyOvqwUNjdCI+aXpJwTNd24lyXE/UR\nOxZUkiXIIBY8fDPywrllJNvIVVlk6EledxUfjuYNmNIOmT5E+xqn363zgvWhvOJs\nE9B8aeBTycohdsFnxFhjrMvtMyNSnHM53/cWJvzutE/S+/wd6fjt1lgh4Rqd50Ff\nVFrBtfVcqNDaB7crZnBjlth6G0EEtGo22xTUNBoqcOoJs6IiUlSBh1TXocT3wHZx\nIrjqi7A0DU2MBrJpZvOVJhYpfTyWM93XXp84ovZTYQKBgQD/GPtE/lSKis46axKZ\nKvEKdALkAWJIkq+8s9hKyVVl82LoRpAVXCxMWIu+7vh/ItypjBjmtrV/MwTDYTXR\nKM5+rRTGsEOXP02ingblF/ukreJGyhYd7lj0qwOy/fJLaoaguTDpXXKUkxWfxB/j\nAqLegsMIq3ZQHsb5W95jxd1bHQKBgQC99Ph21fAy1BELOt8/HNx+vMLACzZmAZ9H\nUk5GxXcyiEnW9efz14L/2W9CmDTyBZBXJlWxCETKCPzuIofZLsytn0MoPaUOlGtc\nuemFYoAq8+9sORCpW5QF8qhSUGW0hzvKmK0rcz3hUdQ9lhMW3539WGpk2NCdFKyu\nt/KO8URMZwKBgQCF2EOuVYtiDaZa/GcLun4yL+B8ZUV+MojGh85KnwyRq3wPx0Y+\nDtinTiY0jgoQGuiQhRNjqiXckZZENTMZhUGjMYkfHsi4CNzhH+0aMtUz+JAq+ElW\ndwJxjXEpbxi7/S6aEdDaAM/nqKzF4Q+h+nYeLZnLaLtxGlTn7Q3oZ57W+QKBgQCX\njV26ef+UnesnOYYptV4Z44HBdHCnO74XSgxXnG34LBI1ZaX0vsmuVIzW5dbADT5W\nuaf+gSlYw4kAeR5HYXY9Q2ZyMZSBqFpr9YvhNnApVMt9XZ30cLMNd8dhPPGX8Zj7\nj4oBs4T4QrABnr2GL0y+dw8TfIQb/wWys+Hat5UVGwKBgFvnGrP+JOnyGBEylkVf\nPX+NKAF2UHG5ZUXeXBw/wTre1aLUvzLpmzz4gR0KJwpRduz7bHYgUZoY6g93JOeS\n5B6U5KoLOH3RZb3+oK0nXmrZQh5YapIDcEspW/7Jvqasi+cV3m7aXxzfwi2Be2ck\nHQrTeUTchSQ4CA3Rfhle6azY\n-----END PRIVATE KEY-----\n'
		const payload = { sub: '1234567890', name: 'test' }
		const token = await signJwt(payload, escapedPrivateKey, { alg: 'RS256' })
		
		expect(typeof token).toBe('string')
		expect(token.split('.').length).toBe(3)
		expect(token).toMatch(/^eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9\./)
		const [headerBase64] = token.split('.')
		const header = JSON.parse(atob(headerBase64))
		expect(header.alg).toBe('RS256')
		expect(header.typ).toBe('JWT')
		const [, payloadBase64] = token.split('.')
		const decodedPayload = JSON.parse(atob(payloadBase64))
		expect(decodedPayload.sub).toBe('1234567890')
		expect(decodedPayload.name).toBe('test')
	})

	it('should throw error for invalid payload', async () => {
		await expect(signJwt('invalid', 'secret', { alg: 'HS256' })).rejects.toThrow('Payload must be a non-null object')
	})
}) 