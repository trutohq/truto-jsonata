import jsonata, { Expression } from 'jsonata'
import mirrorNativeInput from './mirrorNativeInput'
import toHostArg, { HostArgState, markMutable } from './toHostArg'

type Implementation = (...args: unknown[]) => unknown

type NativeFunction = { implementation: (value: unknown) => unknown }

// JSONata's own $clone, taken once from a bare expression.
let builtinClone: Promise<NativeFunction> | undefined

// The transform operator gets its copy from `$clone` and then writes the
// update into it, so toHostArg must not cache any node of that copy. Same
// result as the builtin.
async function trackedClone(value: unknown) {
  builtinClone ??= jsonata('$clone').evaluate({}) as Promise<NativeFunction>
  const copy = (await builtinClone).implementation(value)
  markMutable(copy)
  return copy
}

const withTrackedClone = new WeakSet<Expression>()

// Whether an expression names $clone itself (`$clone := ...`, a `$clone`
// parameter, `@$clone`, `#$clone`). Its own $clone would hide trackedClone
// from the transform, so its calls skip the caches.
const namesClone = new WeakMap<Expression, boolean>()

function astNamesClone(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as Record<string, unknown>
  if (
    (n.type === 'variable' && n.value === 'clone') ||
    n.focus === 'clone' ||
    n.index === 'clone'
  ) {
    return true
  }
  return Object.values(n).some(astNamesClone)
}

type Focus = { environment?: { base?: { lookup?: (name: string) => unknown } } }

// The caches stay on only while the transform will get trackedClone: the
// expression does not name $clone and no evaluate binding replaces it.
function canCache(expression: Expression, focus: unknown): boolean {
  let names = namesClone.get(expression)
  if (names === undefined) {
    names = astNamesClone(expression.ast())
    namesClone.set(expression, names)
  }
  if (names) return false
  const clone = (focus as Focus)?.environment?.base?.lookup?.('clone') as
    | { implementation?: unknown }
    | undefined
  return clone?.implementation === trackedClone
}

/**
 * Register a Truto function so it gets its arguments in the shape the helpers
 * were written against under JSONata 2.0 (see toHostArg): Object.prototype
 * restored on JSONata 2.2 null-prototype objects, and raw luxon DateTimes.
 * When a DateTime was unwrapped, DateTimes in the result are wrapped again so
 * the expression can still read them (`$firstNonEmpty($d1, $d2).toISO()`).
 */
export default function registerHostFunction(
  expression: Expression,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  implementation: (...args: any[]) => unknown,
  signature?: string
) {
  const fn = implementation as Implementation
  const wrapped = function (this: unknown, ...args: unknown[]) {
    const state: HostArgState = {
      unwrappedDateTime: false,
      cache: canCache(expression, this),
    }
    for (let i = 0; i < args.length; i++) args[i] = toHostArg(args[i], state)
    const result = fn.apply(this, args)
    if (!state.unwrappedDateTime) return result
    return result instanceof Promise
      ? result.then(value => mirrorNativeInput(value))
      : mirrorNativeInput(result)
  }
  // Keep the declared parameters visible. Callers read the count from
  // `implementation.length` ($each/$sift trim callback args by it), and
  // jsonata reads the parameter list from the source text to partially apply
  // a function (`$f(?, 1)`) and to size callback args, so report the
  // original source too.
  Object.defineProperty(wrapped, 'length', { value: fn.length })
  Object.defineProperty(wrapped, 'toString', {
    value: () => Function.prototype.toString.call(fn),
  })
  expression.registerFunction(name, wrapped, signature)
  if (!withTrackedClone.has(expression)) {
    withTrackedClone.add(expression)
    expression.registerFunction('clone', trackedClone, '<(oa)-:o>')
  }
}
