import { diceCoefficient } from 'dice-coefficient'
import { reduce } from 'lodash-es'

function getNormalizedString(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mostSimilar(value: string, possibleValues: string[], threshold = 0.8) {
  const normalizedValue = getNormalizedString(value)
  const result = reduce(
    possibleValues,
    (acc, possibleValue) => {
      const normalizedPossibleValue = getNormalizedString(possibleValue)
      const similarity = diceCoefficient(
        normalizedValue,
        normalizedPossibleValue
      )
      if (similarity > acc.similarity) {
        return { similarity, value: possibleValue }
      }
      return acc
    },
    { similarity: 0, value: '' }
  )
  return result.similarity >= threshold ? result.value : value
}

export default mostSimilar
