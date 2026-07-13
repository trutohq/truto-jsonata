import jsonata, { Expression } from 'jsonata'
import registerJsonataExtensions from './registerJsonataExtensions'
import deepUnwrapNative from './functions/deepUnwrapNative'
import mirrorNativeInput from './functions/mirrorNativeInput'

type EvaluateCallback = (err: unknown, value: unknown) => void

export default function trutoJsonata(expression: string): Expression {
  const expr = registerJsonataExtensions(jsonata(expression))
  const evaluate = expr.evaluate.bind(expr)

  // JSONata 2.2 only reads own properties and boxes native returns in wrappers.
  // Mirror native inputs (URL/Response/File/Blob/ArrayBuffer/Date/DateTime/
  // ReadableStream/typed arrays) so expressions can read them, then unwrap
  // wrappers and normalize 2.2's null-prototype result objects so callers keep
  // the 2.0 host contract.
  // Lets a host upgrade by only bumping the version.
  function boundEvaluate(
    input: unknown,
    bindings?: Record<string, unknown>,
    callback?: EvaluateCallback
  ): Promise<unknown> | void {
    const safeInput = mirrorNativeInput(input)
    const safeBindings =
      bindings === undefined ? undefined : mirrorNativeInput(bindings)
    if (typeof callback === 'function') {
      const result = evaluate(
        safeInput,
        safeBindings,
        (err: unknown, value: unknown) =>
          callback(err, err ? value : deepUnwrapNative(value))
      )
      return result === undefined
        ? undefined
        : Promise.resolve(result).then(value => deepUnwrapNative(value))
    }
    return Promise.resolve(evaluate(safeInput, safeBindings)).then(value =>
      deepUnwrapNative(value)
    )
  }

  expr.evaluate = boundEvaluate as unknown as Expression['evaluate']
  return expr
}
