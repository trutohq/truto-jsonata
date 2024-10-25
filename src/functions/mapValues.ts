const isString = (value: unknown): value is string =>
  typeof value === 'string' || value instanceof String

const isNumber = (value: unknown): value is number => typeof value === 'number'
const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function mapValues(
  originalValue:
    | string
    | string[]
    | Record<string, unknown>
    | Record<string, unknown>[]
    | unknown
    | undefined,
  mapping: Record<string, unknown> | null | undefined,
  lowerCase = false,
  defaultValue = null
):
  | string
  | string[]
  | Record<string, unknown>
  | Record<string, unknown>[]
  | unknown
  | undefined {
  if (
    (originalValue === null || originalValue === undefined) &&
    defaultValue !== null
  ) {
    return defaultValue
  }
  if (mapping === null || mapping === undefined) {
    return originalValue
  }
  let newMapping: Record<string, unknown> = {}
  if (!lowerCase) {
    Object.entries(mapping).forEach(([key, value]) => {
      newMapping[key.toLowerCase()] = value
    })
  } else {
    newMapping = {
      ...mapping,
    }
  }
  if (isString(originalValue) || isNumber(originalValue)) {
    const val = newMapping[originalValue.toString().toLowerCase()]
    if (val === null || val === undefined) {
      return originalValue
    }
    if (val === false) {
      return val
    }
    return val
  }
  if (isArray(originalValue)) {
    return originalValue.map(value => mapValues(value, newMapping, true))
  }
  if (isPlainObject(originalValue)) {
    const result: Record<string, unknown> = {}
    Object.entries(originalValue).forEach(([key, value]) => {
      result[key] = mapValues(value, newMapping, true)
    })
    return result
  }
  return originalValue
}

export default mapValues
