import trutoJsonata from '../../index'
import { WRAPPER_REGRESSION_ERROR } from './unifiedModelScan'

/** Smoke-evaluate a mapping snippet; only fail on JSONata 2.2 wrapper breakage. */
export async function smokeEvaluateMapping(
  expression: string,
  fixture: Record<string, unknown>
) {
  let expr
  try {
    expr = trutoJsonata(expression)
  } catch (error) {
    throw new Error(
      `${expression}\n  → parse error: ${(error as Error).message}`
    )
  }

  try {
    return await expr.evaluate(fixture)
  } catch (error) {
    const message = (error as Error).message
    if (WRAPPER_REGRESSION_ERROR.test(message)) {
      throw new Error(`${expression}\n  → ${message}`)
    }
    if (message.includes('Syntax error') || message.includes('Expected ')) {
      return undefined
    }
    return undefined
  }
}
