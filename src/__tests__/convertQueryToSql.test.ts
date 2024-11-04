import { describe, expect, it } from 'vitest'
import convertQueryToSql from '../functions/convertQueryToSql'

describe('convertQueryToSql', async () => {
  describe('eq', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: '123',
      })
      expect(result).toBe('id = 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          eq: '123',
        },
      })
      expect(result).toBe('id = 123')
    })
  })

  describe('ne', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          ne: '123',
        },
      })
      expect(result).toBe('id <> 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          ne: '123',
        },
      })
      expect(result).toBe('id <> 123')
    })
  })

  describe('gt', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          gt: '123',
        },
      })
      expect(result).toBe('id > 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          gt: '123',
        },
      })
      expect(result).toBe('id > 123')
    })
  })

  describe('gte', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          gte: '123',
        },
      })
      expect(result).toBe('id >= 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          gte: '123',
        },
      })
      expect(result).toBe('id >= 123')
    })
  })

  describe('lt', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          lt: '123',
        },
      })
      expect(result).toBe('id < 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          lt: '123',
        },
      })
      expect(result).toBe('id < 123')
    })
  })

  describe('lte', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          lte: '123',
        },
      })
      expect(result).toBe('id <= 123')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          lte: '123',
        },
      })
      expect(result).toBe('id <= 123')
    })
  })

  describe('in', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          in: ['123', '456'],
        },
      })
      expect(result).toBe('id in (123,456)')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          in: ['123', '456'],
        },
      })
      expect(result).toBe('id in (123,456)')
    })
  })

  describe('nin', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          nin: ['123', '456'],
        },
      })
      expect(result).toBe('id not in (123,456)')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          nin: ['123', '456'],
        },
      })
      expect(result).toBe('id not in (123,456)')
    })
  })

  describe('multiple operators', () => {
    it('value is string', () => {
      const result = convertQueryToSql({
        id: {
          in: ['123', '456'],
          gt: '123',
          lt: '456',
        },
      })
      expect(result).toBe('id in (123,456) AND id > 123 AND id < 456')
    })
    it('value is an object', () => {
      const result = convertQueryToSql({
        id: {
          in: ['123', '456'],
          gt: '123',
        },
      })
      expect(result).toBe('id in (123,456) AND id > 123')
    })
  })

  describe('mapping', () => {
    it('mapping is undefined', () => {
      const result = convertQueryToSql(
        {
          id: '123',
        },
        undefined
      )
      expect(result).toBe('id = 123')
    })
    it('mapping is defined', () => {
      const result = convertQueryToSql(
        {
          id: '123',
        },
        [],
        {
          id: 'Id',
        }
      )
      expect(result).toBe('Id = 123')
    })
    it('mapping is defined and value is an object', () => {
      const result = convertQueryToSql(
        {
          id: {
            eq: '123',
          },
        },
        [],
        {
          id: 'Id',
        }
      )
      expect(result).toBe('Id = 123')
    })
    it('mapping is defined and value is an object and operator is in', () => {
      const result = convertQueryToSql(
        {
          id: {
            in: ['123', '456'],
          },
        },
        [],
        {
          id: 'Id',
        }
      )
      expect(result).toBe('Id in (123,456)')
    })
    it('mapping is defined and value is an array', () => {
      const result = convertQueryToSql(
        {
          id: ['123', '456'],
        },
        [],
        {
          id: 'Id',
        }
      )
      expect(result).toBe('Id in (123,456)')
    })
  })

  describe('dataTypes', () => {
    describe('string', () => {
      it('value is string', () => {
        const result = convertQueryToSql(
          {
            id: '123',
          },
          [],
          undefined,
          {
            id: 'string',
          }
        )
        expect(result).toBe("id = '123'")
      })
      it('value is an object', () => {
        const result = convertQueryToSql(
          {
            id: {
              eq: '123',
            },
          },
          [],
          undefined,
          {
            id: 'string',
          }
        )
        expect(result).toBe("id = '123'")
      })
      it('value is an array', () => {
        const result = convertQueryToSql(
          {
            id: ['123', '456'],
          },
          [],
          undefined,
          {
            id: 'string',
          }
        )
        expect(result).toBe("id in ('123','456')")
      })
      it('mapping is defined and value is an object and operator is in', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
            },
          },
          [],
          undefined,
          {
            id: 'string',
          }
        )
        expect(result).toBe("id in ('123','456')")
      })
      it('multiple operators', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
              like: '123',
            },
          },
          [],
          undefined,
          {
            id: 'string',
          }
        )
        expect(result).toBe("id in ('123','456') AND id like '123'")
      })
    })
    describe('number', () => {
      it('value is string', () => {
        const result = convertQueryToSql(
          {
            id: '123',
          },
          [],
          undefined,
          {
            id: 'number',
          }
        )
        expect(result).toBe('id = 123')
      })
      it('value is an object', () => {
        const result = convertQueryToSql(
          {
            id: {
              eq: '123',
            },
          },
          [],
          undefined,
          {
            id: 'number',
          }
        )
        expect(result).toBe('id = 123')
      })
      it('value is an array', () => {
        const result = convertQueryToSql(
          {
            id: ['123', '456'],
          },
          [],
          undefined,
          {
            id: 'number',
          }
        )
        expect(result).toBe('id in (123,456)')
      })
      it('mapping is defined and value is an object and operator is in', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
            },
          },
          [],
          undefined,
          {
            id: 'number',
          }
        )
        expect(result).toBe('id in (123,456)')
      })
    })
    describe('boolean', () => {
      it('value is string', () => {
        const result = convertQueryToSql(
          {
            id: 'true',
          },
          [],
          undefined,
          {
            id: 'boolean',
          }
        )
        expect(result).toBe('id = true')
      })

      it('value is an object', () => {
        const result = convertQueryToSql(
          {
            id: {
              eq: 'true',
            },
          },
          [],
          undefined,
          {
            id: 'boolean',
          }
        )
        expect(result).toBe('id = true')
      })

      it('value is an array', () => {
        const result = convertQueryToSql(
          {
            id: ['true', 'false'],
          },
          [],
          undefined,
          {
            id: 'boolean',
          }
        )
        expect(result).toBe('id in (true,false)')
      })

      it('mapping is defined and value is an object and operator is in', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['true', 'false'],
            },
          },
          [],
          undefined,
          {
            id: 'boolean',
          }
        )
        expect(result).toBe('id in (true,false)')
      })
    })
    describe('dotnetdate', () => {
      it('value is string', () => {
        const result = convertQueryToSql(
          {
            id: '2023-07-27T15:11:07.532Z',
          },
          [],
          undefined,
          {
            id: 'dotnetdate',
          }
        )
        expect(result).toBe('id = DateTime(2023,07,27)')
      })

      it('value is an object', () => {
        const result = convertQueryToSql(
          {
            id: {
              eq: '2021-01-01',
            },
          },
          [],
          undefined,
          {
            id: 'dotnetdate',
          }
        )
        expect(result).toBe('id = DateTime(2021,01,01)')
      })

      it('value is an array', () => {
        const result = convertQueryToSql(
          {
            id: ['2021-01-01', '2021-01-02'],
          },
          [],
          undefined,
          {
            id: 'dotnetdate',
          }
        )
        expect(result).toBe('id in (DateTime(2021,01,01),DateTime(2021,01,02))')
      })

      it('mapping is defined and value is an object and operator is in', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['2021-01-01', '2021-01-02'],
            },
          },
          [],
          undefined,
          {
            id: 'dotnetdate',
          }
        )
        expect(result).toBe('id in (DateTime(2021,01,01),DateTime(2021,01,02))')
      })
    })
    describe('object', () => {
      it('value is string', () => {
        const result = convertQueryToSql(
          {
            type: 'bank',
          },
          [],
          undefined,
          {
            type: {
              bank: 'BANK',
            },
          }
        )
        expect(result).toBe("type = 'BANK'")
      })
      it('value is string but data type mapping doesnt have a matching value', () => {
        const result = convertQueryToSql(
          {
            type: 'blah',
          },
          [],
          undefined,
          {
            type: {
              bank: 'BANK',
            },
          }
        )
        expect(result).toBe("type = 'blah'")
      })
      describe('boolean', () => {
        it('true', () => {
          const result = convertQueryToSql(
            {
              type: 'bank',
            },
            [],
            undefined,
            {
              type: {
                bank: true,
              },
            }
          )
          expect(result).toBe('type = true')
        })
        it('false', () => {
          const result = convertQueryToSql(
            {
              type: 'bank',
            },
            [],
            undefined,
            {
              type: {
                bank: false,
              },
            }
          )
          expect(result).toBe('type = false')
        })
      })
    })
  })

  describe('customOperatorMapping', () => {
    it('should map custom operator when defined', () => {
      const result = convertQueryToSql(
        {
          id: {
            ne: '123',
          },
        },
        [],
        undefined,
        undefined,
        {
          ne: '!=',
        }
      )
      expect(result).toBe('id != 123')
    })
    it('should map eq custom operator when defined', () => {
      const result = convertQueryToSql(
        {
          id: '123',
        },
        [],
        undefined,
        undefined,
        {
          eq: '==',
        }
      )
      expect(result).toBe('id == 123')
    })
  })

  describe('options', () => {
    describe('useOrForIn', () => {
      it('should use OR for IN operator', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
            },
          },
          [],
          undefined,
          undefined,
          undefined,
          {
            useOrForIn: true,
          }
        )
        expect(result).toBe('(id = 123 OR id = 456)')
      })
      it('should use OR for IN operator and multiple operators', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
              gt: '123',
            },
          },
          [],
          undefined,
          undefined,
          undefined,
          {
            useOrForIn: true,
          }
        )
        expect(result).toBe('(id = 123 OR id = 456) AND id > 123')
      })
    })
    describe('conjunction', () => {
      it('should use OR for conjunction', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
              gt: '123',
            },
          },
          [],
          undefined,
          undefined,
          undefined,
          {
            conjunction: 'OR',
          }
        )
        expect(result).toBe('id in (123,456) OR id > 123')
      })
      it('should use AND by default for conjunction', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
              gt: '123',
            },
          },
          [],
          undefined,
          undefined,
          undefined
        )
        expect(result).toBe('id in (123,456) AND id > 123')
      })
    })
    describe('useDoubleQuotes', () => {
      it('should use double quotes for string values', () => {
        const result = convertQueryToSql(
          {
            id: {
              in: ['123', '456'],
              gt: '123',
            },
            type: 'bank',
          },
          [],
          undefined,
          {
            id: 'string',
            type: {
              bank: 'BANK',
            },
          },
          undefined,
          {
            useDoubleQuotes: true,
          }
        )
        expect(result).toBe(
          'id in ("123","456") AND id > "123" AND type = "BANK"'
        )
      })
      it('should never escape single quotes', () => {
        const result = convertQueryToSql(
          {
            name: "Uday's",
          },
          ['name'],
          undefined,
          {
            name: 'string',
          },
          {},
          {
            useDoubleQuotes: true,
          }
        )
        expect(result).toBe(`name = "Uday's"`)
      })
    })
  })

  describe('keysToMap', () => {
    it('should only map the keys in the keysToMap array', () => {
      const result = convertQueryToSql(
        {
          id: {
            in: ['123', '456'],
          },
          name: 'test',
        },
        ['id']
      )
      expect(result).toBe('id in (123,456)')
    })
    it('should return empty string if no keys match keysToMap array', () => {
      const result = convertQueryToSql(
        {
          id: {
            in: ['123', '456'],
          },
          name: 'test',
        },
        ['test']
      )
      expect(result).toBe('')
    })
  })

  describe('groupComparisonInBrackets', () => {
    it('should group comparison in brackets', () => {
      const result = convertQueryToSql(
        {
          id: '87238',
          first_name: 'Uday',
          last_name: 'Bhaskar',
        },
        [],
        undefined,
        undefined,
        undefined,
        {
          groupComparisonInBrackets: true,
        }
      )
      expect(result).toBe(
        '((id = 87238 AND first_name = Uday) AND last_name = Bhaskar)'
      )
    })
    it('should return empty if there is no query ', () => {
      const result = convertQueryToSql(
        {},
        [],
        undefined,
        undefined,
        undefined,
        {
          groupComparisonInBrackets: true,
        }
      )
      expect(result).toBe('')
    })
  })
  describe('escapeSingleQuotes', () => {
    it('should escape single quotes', () => {
      const result = convertQueryToSql(
        {
          name: "Uday's",
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: true,
        }
      )
      expect(result).toBe(`name = 'Uday\\'s'`)
    })
    it('should escape single quotes in array of strings', () => {
      const result = convertQueryToSql(
        {
          name: ["Uday's", 'Bhaskar'],
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: true,
        }
      )
      expect(result).toBe(`name in ('Uday\\'s','Bhaskar')`)
    })
    it('should not escape single quotes in array of strings', () => {
      const result = convertQueryToSql(
        {
          name: ["Uday's", 'Bhaskar'],
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: false,
        }
      )
      expect(result).toBe(`name in ('Uday's','Bhaskar')`)
    })
    it('should escape single quotes when in object', () => {
      const result = convertQueryToSql(
        {
          name: `{
            LIKE: '%' + "Uday's" + '%',
          }`,
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: true,
        }
      )
      expect(result).toBe(`name = '{
            LIKE: \\'%\\' + "Uday\\'s" + \\'%\\',
          }'`)
    })
    it('should not escape single quotes when in object', () => {
      const result = convertQueryToSql(
        {
          name: `{
            LIKE: '%' + "Uday's" + '%',
          }`,
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: false,
        }
      )
      expect(result).toBe(`name = '{
            LIKE: '%' + "Uday's" + '%',
          }'`)
    })
    it('should escape multiple single quotes', () => {
      const result = convertQueryToSql(
        {
          name: "Uday's Accounts Contact's",
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          escapeSingleQuotes: true,
        }
      )
      expect(result).toBe(`name = 'Uday\\'s Accounts Contact\\'s'`)
    })
    it('should not escape single quotes', () => {
      const result = convertQueryToSql(
        {
          name: "Uday's",
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {}
      )
      expect(result).toBe(`name = 'Uday's'`)
    })
    it('should use double quotes when both useDoubleQuotes and escapeSingleQuotes set to true', () => {
      const result = convertQueryToSql(
        {
          name: "Uday's",
        },
        ['name'],
        undefined,
        {
          name: 'string',
        },
        {},
        {
          useDoubleQuotes: true,
          escapeSingleQuotes: true,
        }
      )
      expect(result).toBe(`name = "Uday's"`)
    })
  })
})

export default {}
