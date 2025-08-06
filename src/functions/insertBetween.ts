import { castArray, flatMap } from 'lodash-es'

const insertBetween = (arr: any[], value: any) => {
  return flatMap(arr, (item, index) => {
    return index === arr.length - 1 ? [item] : [item, ...castArray(value)]
  })
}

export default insertBetween
