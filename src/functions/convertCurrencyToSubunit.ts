import { isNil } from 'lodash'
import currency from './currency.json'

function convertCurrencyToSubunit(arg: string, currencyCode: string) {
  if (isNil(arg)) {
    return arg
  }
  // @ts-ignore
  if (currency[currencyCode]) {
    const amount = parseFloat(arg)
    // @ts-ignore
    const subunit = currency[currencyCode].digits
    return Math.floor(amount * Math.pow(10, subunit))
  }
  return arg
}

export default convertCurrencyToSubunit
