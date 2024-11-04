import { describe, expect, it } from 'vitest'
import mapValues from '../functions/mapValues'

describe('mapValues', async () => {
  describe('string', () => {
    it('should map the value correctly when value has a mapping', () => {
      const mapping = {
        bank: 'BANK',
        credit_card: 'CREDIT_CARD',
      }
      const result = mapValues('bank', mapping)
      expect(result).toBe('BANK')
    })
    it('should return the original value when value has no mapping', () => {
      const mapping = {
        bank: 'BANK',
        credit_card: 'CREDIT_CARD',
      }
      const result = mapValues('other', mapping)
      expect(result).toBe('other')
    })
  })
  describe('array', () => {
    describe('empty array', () => {
      it('should return the original value when value is an empty array', () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues([], mapping)
        expect(result).toEqual([])
      })
    })
    describe('array of strings', () => {
      it('should map the value correctly when value has a mapping', () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues(['bank', 'credit_card'], mapping)
        expect(result).toEqual(['BANK', 'CREDIT_CARD'])
      })
      it('should return the original value when value has no mapping', () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues(['other'], mapping)
        expect(result).toEqual(['other'])
      })
    })
    describe('array of objects', () => {
      it("should map the value correctly when value's properties have a mapping", () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues(
          [
            {
              type: 'bank',
            },
            {
              type: 'credit_card',
            },
          ],
          mapping
        )
        expect(result).toEqual([
          {
            type: 'BANK',
          },
          {
            type: 'CREDIT_CARD',
          },
        ])
      })
      it("should return the original value when value's properties have no mapping", () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues(
          [
            {
              type: 'other',
            },
          ],
          mapping
        )
        expect(result).toEqual([
          {
            type: 'other',
          },
        ])
      })
      it("should map the value correctly when value's properties have arrays or complex object", () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues(
          [
            {
              type: 'bank',
              tags: ['bank'],
            },
            {
              type: 'credit_card',
              level1: {
                level2: {
                  tags: ['credit_card'],
                  type: 'other',
                },
              },
            },
          ],
          mapping
        )
        expect(result).toEqual([
          {
            type: 'BANK',
            tags: ['BANK'],
          },
          {
            type: 'CREDIT_CARD',
            level1: {
              level2: {
                tags: ['CREDIT_CARD'],
                type: 'other',
              },
            },
          },
        ])
      })
    })
    describe('array of arrays', () => {
      it('should map the value correctly when value has a mapping', () => {
        const mapping = {
          bank: 'BANK',
          credit_card: 'CREDIT_CARD',
        }
        const result = mapValues([['bank', 'credit_card']], mapping)
        expect(result).toEqual([['BANK', 'CREDIT_CARD']])
      })
    })
  })
  describe('undefined', () => {
    it('should return undefined when value is undefined', () => {
      const mapping = {
        bank: 'BANK',
        credit_card: 'CREDIT_CARD',
      }
      const result = mapValues(undefined, mapping)
      expect(result).toBe(undefined)
    })
  })
  describe('boolean', () => {
    it('should return the original value when value is a boolean', () => {
      const mapping = {
        bank: 'BANK',
        credit_card: 'CREDIT_CARD',
      }
      const result = mapValues(true, mapping)
      expect(result).toBe(true)
    })
    it('should return true when value is a string and has a boolean mapping', () => {
      const mapping = {
        bank: true,
        credit_card: false,
      }
      const result = mapValues('bank', mapping)
      expect(result).toBe(true)
    })
    it('should return false when value is a string and has a boolean mapping', () => {
      const mapping = {
        bank: true,
        credit_card: false,
      }
      const result = mapValues('credit_card', mapping)
      expect(result).toBe(false)
    })
  })
  describe('mapping', () => {
    it('should return the original value when mapping is undefined', () => {
      const result = mapValues('other', undefined)
      expect(result).toBe('other')
    })
    it('should return the original value when mapping is null', () => {
      const result = mapValues('other', null)
      expect(result).toBe('other')
    })
  })
})
