import { diceCoefficient } from 'dice-coefficient'

function getNormalizedString(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function _diceCoefficient(value: string, value2: string) {
  if (value === value2) {
    return 1
  }
  const normalizedValue = getNormalizedString(value)
  const normalizedValue2 = getNormalizedString(value2)
  return diceCoefficient(normalizedValue, normalizedValue2)
}

export default _diceCoefficient
