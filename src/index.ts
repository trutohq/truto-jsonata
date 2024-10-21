import jsonata, { Expression } from 'jsonata'
import registerJsonataExtensions from './registerJsonataExtensions'

export default function trutoJsonata(expression: string): Expression {
  return registerJsonataExtensions(jsonata(expression))
}
