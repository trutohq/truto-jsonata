import { isString, toNumber as toNumberValue } from 'lodash-es'
function toNumber(value : string ) {
  if (!isString(value)) {
    return NaN
  }
  return toNumberValue(value)
}

export default toNumber
