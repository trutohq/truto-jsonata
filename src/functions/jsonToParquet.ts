import { parquetWriteBuffer } from 'hyparquet-writer'
import { toJsonataArrayBuffer } from './toJsonataArrayBuffer'
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

const PARQUET_MAGIC = 'PAR1'
// A well-formed Parquet file is at minimum a "PAR1" header (4 bytes) + the
// footer metadata length as an int32 (4 bytes) + a "PAR1" footer (4 bytes).
const PARQUET_MIN_BYTES = 12

function readMagic(bytes: Uint8Array, start: number): string {
  return String.fromCharCode(
    bytes[start],
    bytes[start + 1],
    bytes[start + 2],
    bytes[start + 3]
  )
}

/**
 * Verify that `buffer` looks like a structurally valid Parquet file before it
 * is handed back to a caller. A valid file is a non-empty body that opens and
 * closes with the `PAR1` magic markers and declares a footer-metadata length
 * that fits within the body. Anything else (an empty body, truncated/garbage
 * bytes, a corrupt footer) throws a descriptive error instead of being
 * returned, so no caller uploads or persists a broken Parquet object.
 *
 * This is an intentionally cheap structural check — it does not parse the
 * thrift footer — which keeps it dependency-free and safe to run on every
 * write in Cloudflare Workers and other hot paths.
 */
function assertValidParquet(buffer: ArrayBuffer): void {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error(
      '$jsonToParquet expected the Parquet writer to return an ArrayBuffer but it did not'
    )
  }
  if (buffer.byteLength === 0) {
    throw new Error(
      '$jsonToParquet produced an empty body; refusing to return invalid Parquet bytes'
    )
  }
  if (buffer.byteLength < PARQUET_MIN_BYTES) {
    throw new Error(
      `$jsonToParquet produced only ${buffer.byteLength} bytes, too small to be a valid Parquet file`
    )
  }

  const bytes = new Uint8Array(buffer)
  const header = readMagic(bytes, 0)
  const footer = readMagic(bytes, buffer.byteLength - 4)
  if (header !== PARQUET_MAGIC || footer !== PARQUET_MAGIC) {
    throw new Error(
      `$jsonToParquet produced an invalid Parquet structure; expected "PAR1" magic markers but found header="${header}", footer="${footer}"`
    )
  }

  // The 4 bytes immediately before the trailing magic hold the footer metadata
  // length (little-endian int32). It must be positive and fit inside the body.
  const footerLength = new DataView(buffer).getUint32(
    buffer.byteLength - 8,
    true
  )
  if (footerLength <= 0 || footerLength + PARQUET_MIN_BYTES > buffer.byteLength) {
    throw new Error(
      `$jsonToParquet produced a corrupt Parquet footer; declared metadata length ${footerLength} does not fit within ${buffer.byteLength} bytes`
    )
  }
}

export default function jsonToParquet(
  json: Record<string, unknown> | Record<string, unknown>[],
  options?: JsonToParquetOptions | Record<string, unknown>
) {
  const jsonArray = compact(
    castArray(json)
  ) as Record<string, unknown>[]
  if (isEmpty(jsonArray)) {
    throw new Error(
      '$jsonToParquet received no rows to encode; a valid Parquet file requires at least one record'
    )
  }

  const names = collectColumnNames(jsonArray)
  if (isEmpty(names)) {
    throw new Error(
      '$jsonToParquet received rows with no columns; a valid Parquet file requires at least one field'
    )
  }

  const columnData = map(names, (col) =>
    columnSourceFor(
      col,
      map(jsonArray, (row) => (has(row, col) ? get(row, col) : null))
    )
  )

  const opts = (options ?? {}) as JsonToParquetOptions
  const buffer = parquetWriteBuffer({
    columnData,
    ...(opts.codec !== undefined ? { codec: opts.codec } : {}),
    ...(opts.rowGroupSize !== undefined
      ? { rowGroupSize: opts.rowGroupSize }
      : {}),
  })

  assertValidParquet(buffer)
  return toJsonataArrayBuffer(buffer)
}
