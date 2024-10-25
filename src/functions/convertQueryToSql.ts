import { DateTime } from 'luxon'
import mapValues from './mapValues'

type Operators =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'

const operatorMapping: Record<Operators, string> = {
  eq: '=',
  ne: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'in',
  nin: 'not in',
  like: 'like',
}

export type QueryOperators = {
  eq?: string
  ne?: string
  gt?: string
  gte?: string
  lt?: string
  lte?: string
  in?: string[]
  nin?: string[]
  like?: string
}

export type RequestQuery = Record<
  string,
  string | string[] | QueryOperators | { or: RequestQuery[] }
>

export type RequestDataTypes =
  | 'string'
  | 'double_quote_string'
  | 'number'
  | 'boolean'
  | 'dotnetdate'
  | string
  | Record<string, string | boolean>

type ConvertQueryToSqlOptions = {
  useOrForIn?: boolean
  conjunction?: string
  useDoubleQuotes?: boolean
  noSpaceBetweenOperator?: boolean
  noQuotes?: boolean
  noQuotesForDate?: boolean
  groupComparisonInBrackets?: boolean
  escapeSingleQuotes?: boolean
}

const convertToDataType = (
  value: string | undefined | null,
  key: string,
  dataType: Record<string, RequestDataTypes>,
  useDoubleQuotes = false,
  noQuotes = false,
  noQuotesForDate = false,
  escapeSingleQuotes = false
) => {
  const dataTypeKey = dataType[key]
  if (value === undefined || value === null) {
    return value
  }
  if (dataTypeKey === 'string') {
    if (noQuotes) {
      return value
    } else if (useDoubleQuotes) {
      return `"${value}"`
    } else if (escapeSingleQuotes) {
      return `'${value.replace(/'/g, "\\'")}'`
    } else {
      return `'${value}'`
    }
  }
  if (dataTypeKey === 'dotnetdate') {
    return `DateTime(${DateTime.fromISO(value).toFormat('yyyy,MM,dd')})`
  }
  if (typeof dataTypeKey === 'object') {
    const val = mapValues(value, dataType[key] as Record<string, string>)
    if (typeof val === 'string' || val instanceof String) {
      return noQuotes ? val : useDoubleQuotes ? `"${val}"` : `'${val}'`
    }
    return val
  }
  if (dataTypeKey && dataTypeKey.startsWith('date')) {
    const format = dataTypeKey.split('|')[1]
    const date = format
      ? DateTime.fromISO(value).toFormat(format)
      : DateTime.fromISO(value).toISO()
    return noQuotes || noQuotesForDate
      ? date
      : useDoubleQuotes
      ? `"${date}"`
      : `'${date}'`
  }
  return value
}

function getSqlString({
  key,
  operator,
  value,
  useSpace = false,
}: {
  key: string
  operator: string
  value: unknown
  useSpace: boolean
}) {
  const space = useSpace ? ' ' : ''
  return `${key}${space}${operator}${space}${value}`
}

function convertQueryToSql(
  query: RequestQuery,
  keysToMap: string[] = [],
  mapping: Record<string, string> = {},
  dataTypes: Record<string, RequestDataTypes> = {},
  customOperatorMapping: Record<string, string> = {},
  options: ConvertQueryToSqlOptions = {}
) {
  const conjunction = options.conjunction || 'AND'
  const statement: string[] = []

  const keys = !keysToMap.length ? Object.keys(query) : keysToMap

  for (const key of keys) {
    if (key === 'or') {
      const orPart = convertQueryToSql(
        query[key] as RequestQuery,
        keys,
        mapping,
        dataTypes,
        customOperatorMapping,
        options
      )
      statement.push('(' + orPart + ')')
      continue
    }

    const comparison = query[key]

    let operators: Operators[] = ['eq']

    if (Array.isArray(comparison)) {
      operators = ['in']
    } else if (typeof comparison === 'object') {
      operators = Object.keys(comparison) as Operators[]
    }

    const sqlKey = mapping[key] || key

    for (const operator of operators) {
      const comparator =
        customOperatorMapping[operator] || operatorMapping[operator]
      if (operator !== 'in' && operator !== 'nin' && comparator) {
        const value =
          typeof comparison === 'object'
            ? (comparison as QueryOperators)[operator]
            : comparison
        const valueToInsert = convertToDataType(
          value,
          key,
          dataTypes,
          options.useDoubleQuotes,
          options.noQuotes,
          options.noQuotesForDate,
          options.escapeSingleQuotes
        )
        if (valueToInsert !== undefined && valueToInsert !== null) {
          statement.push(
            getSqlString({
              key: sqlKey,
              operator: comparator,
              value: valueToInsert,
              useSpace: !options.noSpaceBetweenOperator,
            })
          )
        }
        continue
      }
      if (operator === 'in' || operator === 'nin') {
        const value = Array.isArray(comparison)
          ? comparison
          : ((comparison as QueryOperators)[operator] as string[])
        if (options.useOrForIn) {
          const orStatement: string[] = []
          const eqOperator =
            customOperatorMapping['eq'] || operatorMapping['eq']
          for (const v of value) {
            const valueToInsert = convertToDataType(
              v,
              key,
              dataTypes,
              options.useDoubleQuotes,
              options.noQuotes,
              options.noQuotesForDate,
              options.escapeSingleQuotes
            )
            if (valueToInsert !== undefined && valueToInsert !== null) {
              orStatement.push(
                getSqlString({
                  key: sqlKey,
                  operator: eqOperator,
                  value: valueToInsert,
                  useSpace: !options.noSpaceBetweenOperator,
                })
              )
            }
          }
          statement.push('(' + orStatement.join(' OR ') + ')')
          continue
        }
        statement.push(
          getSqlString({
            key: sqlKey,
            operator: comparator,
            value: `(${value
              .map(v => {
                return convertToDataType(
                  v,
                  key,
                  dataTypes,
                  options.useDoubleQuotes,
                  options.noQuotes,
                  options.noQuotesForDate,
                  options.escapeSingleQuotes
                )
              })
              .join(',')})`,
            useSpace: !options.noSpaceBetweenOperator,
          })
        )
        continue
      }
      throw new Error(`Unknown operator: ${operator}`)
    }
  }
  if (options.groupComparisonInBrackets && statement.length) {
    return statement.reduce(
      (acc, condition) => `(${acc} ${conjunction} ${condition})`
    )
  }
  return statement.join(` ${conjunction} `)
}

export default convertQueryToSql
