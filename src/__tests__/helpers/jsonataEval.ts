import jsonata, { type Expression } from 'jsonata'
import trutoJsonata from '../../index'
import { registerCoreExtensions } from '../../presets/core'
import { registerDataFormatsExtensions } from '../../presets/data-formats'
import { registerDatetimeExtensions } from '../../presets/datetime'

export async function evalCore(
  expression: string,
  bindings: Record<string, unknown> = {}
) {
  return registerCoreExtensions(jsonata(expression)).evaluate(bindings)
}

export async function evalDatetime(
  expression: string,
  bindings: Record<string, unknown> = {}
) {
  return registerDatetimeExtensions(jsonata(expression)).evaluate(bindings)
}

export async function evalDataFormats(
  expression: string,
  bindings: Record<string, unknown> = {}
) {
  return registerDataFormatsExtensions(jsonata(expression)).evaluate(bindings)
}

export async function evalTruto(
  expression: string,
  bindings: Record<string, unknown> = {}
) {
  return trutoJsonata(expression).evaluate(bindings)
}

export function coreExpr(expression: string): Expression {
  return registerCoreExtensions(jsonata(expression))
}
