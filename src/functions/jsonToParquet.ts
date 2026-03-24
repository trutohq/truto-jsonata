import { parquetWriteBuffer } from 'hyparquet-writer'
import type { ColumnSource } from 'hyparquet-writer'
import {
  castArray,
  compact,
  every,
  filter,
  flatMap,
  get,
  has,
  isBoolean,
  isDate,
  isEmpty,
  isInteger,
  isNil,
  isNull,
  isNumber,
  isObjectLike,
  isString,
  map,
  some,
  uniq,
} from 'lodash-es'

export type JsonToParquetCodec =
  | 'SNAPPY'
  | 'GZIP'
  | 'ZSTD'
  | 'UNCOMPRESSED'

export interface JsonToParquetOptions {
  codec?: JsonToParquetCodec
  rowGroupSize?: number | number[]
}

function isNestedJsonValue(value: unknown): boolean {
  if (!isObjectLike(value)) return false
  if (isDate(value)) return false
  if (value instanceof Uint8Array) return false
  return true
}

function collectColumnNames(rows: Record<string, unknown>[]): string[] {
  return uniq(flatMap(rows, (row) => Object.keys(row)))
}

function columnSourceFor(
  name: string,
  rawValues: unknown[]
): ColumnSource {
  const hasNested = some(
    rawValues,
    (v) => !isNil(v) && isNestedJsonValue(v)
  )

  const data = map(rawValues, (v) => {
    if (isNil(v)) return null
    if (isNestedJsonValue(v)) return JSON.stringify(v)
    return v
  })

  if (hasNested) {
    const jsonData = map(data, (cell) => {
      if (isNull(cell)) return null
      if (isString(cell)) return cell
      return JSON.stringify(cell)
    })
    return { name, data: jsonData as ColumnSource['data'], type: 'JSON' }
  }

  const nonNull = filter(data, (c) => !isNull(c)) as unknown[]
  if (isEmpty(nonNull)) {
    return { name, data: data as ColumnSource['data'] }
  }

  if (every(nonNull, isBoolean)) {
    return { name, data: data as ColumnSource['data'], type: 'BOOLEAN' }
  }

  if (every(nonNull, (c) => typeof c === 'bigint')) {
    return { name, data: data as ColumnSource['data'], type: 'INT64' }
  }

  if (every(nonNull, (c) => c instanceof Date)) {
    return { name, data: data as ColumnSource['data'] }
  }

  if (every(nonNull, isNumber)) {
    const anyNonInteger = some(nonNull, (c) => !isInteger(c as number))
    if (anyNonInteger) {
      return { name, data: data as ColumnSource['data'], type: 'DOUBLE' }
    }
    const anyOutsideInt32 = some(nonNull, (c) => {
      const n = c as number
      return n > 2_147_483_647 || n < -2_147_483_648
    })
    if (anyOutsideInt32) {
      const int64Data = map(data, (cell) => {
        if (isNull(cell)) return null
        return BigInt(cell as number)
      })
      return {
        name,
        data: int64Data as ColumnSource['data'],
        type: 'INT64',
      }
    }
    return { name, data: data as ColumnSource['data'], type: 'INT32' }
  }

  if (every(nonNull, isString)) {
    return { name, data: data as ColumnSource['data'], type: 'STRING' }
  }

  if (every(nonNull, (c) => c instanceof Uint8Array)) {
    return { name, data: data as ColumnSource['data'] }
  }

  const strData = map(data, (cell) => {
    if (isNull(cell)) return null
    if (isDate(cell)) return (cell as Date).toISOString()
    if (typeof cell === 'bigint') return (cell as bigint).toString()
    if (cell instanceof Uint8Array) {
      return new TextDecoder().decode(cell as Uint8Array)
    }
    if (isObjectLike(cell)) return JSON.stringify(cell)
    return String(cell)
  })
  return {
    name,
    data: strData as ColumnSource['data'],
    type: 'STRING',
  }
}

export default function jsonToParquet(
  json: Record<string, unknown> | Record<string, unknown>[],
  options?: JsonToParquetOptions | Record<string, unknown>
): ArrayBuffer {
  const jsonArray = compact(
    castArray(json)
  ) as Record<string, unknown>[]
  if (isEmpty(jsonArray)) {
    return new ArrayBuffer(0)
  }

  const names = collectColumnNames(jsonArray)
  const columnData = map(names, (col) =>
    columnSourceFor(
      col,
      map(jsonArray, (row) => (has(row, col) ? get(row, col) : null))
    )
  )

  const opts = (options ?? {}) as JsonToParquetOptions
  return parquetWriteBuffer({
    columnData,
    ...(opts.codec !== undefined ? { codec: opts.codec } : {}),
    ...(opts.rowGroupSize !== undefined
      ? { rowGroupSize: opts.rowGroupSize }
      : {}),
  })
}
