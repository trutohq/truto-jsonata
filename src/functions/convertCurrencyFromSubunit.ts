import { isNil } from 'lodash'
import currency from './currency.json'

function convertCurrencyFromSubunit(arg: string, currencyCode: string) {
  if (isNil(arg)) {
    return arg
  }
  // @ts-ignore
  if (currency[currencyCode]) {
    const amount = parseFloat(arg)
    // @ts-ignore
    const subunit = currency[currencyCode].digits
    return (amount / Math.pow(10, subunit)).toFixed(subunit)
  }
  return arg
}

export default convertCurrencyFromSubunit
