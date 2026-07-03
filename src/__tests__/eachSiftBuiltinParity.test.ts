import { describe, expect, it } from 'vitest'
import { evalCore } from './helpers/jsonataEval'

// The $each/$sift overrides (null-safety for jsonata 2.2) must otherwise
// behave exactly like the jsonata 2.0 builtins they replace. These are the
// regressions the first override version introduced.
describe('$each/$sift builtin parity', () => {
  describe('context injection (`data.$fn(callback)` idiom)', () => {
    it('injects the context value as $sift input', async () => {
      const result = await evalCore('o.$sift(function($v) { $v > 1 })', {
        o: { a: 1, b: 2 },
      })
      expect(result).toEqual({ b: 2 })
    })

    it('injects the context value as $each input', async () => {
      const result = await evalCore(
        'o.$each(function($v, $k) { $k & "=" & $v })',
        { o: { a: 1, b: 2 } }
      )
      expect(result).toEqual(['a=1', 'b=2'])
    })

    it('supports the documented $sift key-predicate idiom', async () => {
      const result = await evalCore(
        'o.$sift(function($v, $k) { $k ~> /^ke/ })',
        { o: { keep: 1, drop: 2 } }
      )
      expect(result).toEqual({ keep: 1 })
    })
  })

  describe('callback arity handling', () => {
    it('accepts signatured single-arg callbacks in $each', async () => {
      const result = await evalCore('$each(o, $string)', { o: { a: 1, b: 2 } })
      expect(result).toEqual(['1', '2'])
    })

    it('accepts signatured single-arg callbacks in $sift', async () => {
      const result = await evalCore('$sift(o, $boolean)', {
        o: { a: 0, b: 2 },
      })
      expect(result).toEqual({ b: 2 })
    })

    it('still passes key and object to callbacks that declare them', async () => {
      const result = await evalCore(
        '$each(o, function($v, $k, $o) { $k & ":" & $v & "/" & $count($keys($o)) })',
        { o: { a: 1, b: 2 } }
      )
      expect(result).toEqual(['a:1/2', 'b:2/2'])
    })
  })

  describe('$sift effective-boolean semantics', () => {
    it('drops entries whose predicate is an empty array or empty object', async () => {
      const result = await evalCore('$sift(o, function($v) { $v })', {
        o: { emptyArr: [], str: 'x', zero: 0, arr: [1], emptyObj: {} },
      })
      expect(result).toEqual({ str: 'x', arr: [1] })
    })

    it('treats an array with any truthy member as true', async () => {
      const result = await evalCore('$sift(o, function($v) { $v })', {
        o: { mixed: [0, 1], allFalsy: [0, ''] },
      })
      expect(result).toEqual({ mixed: [0, 1] })
    })

    it('throws D1001 for non-finite predicate values like the builtins', async () => {
      // Both jsonata 2.0 and 2.2 builtins throw D1001 (isNumeric) when the
      // predicate result is ±Infinity — a silent drop would hide the error.
      await expect(
        evalCore('$sift(o, function($v) { $v })', { o: { a: 1e309 } })
      ).rejects.toMatchObject({ code: 'D1001' })
    })

    it('keeps entries whose predicate is a function value, like the 2.0 builtin', async () => {
      // jsonata 2.0's boolean() had no isFunction exclusion, so a lambda
      // predicate result (a plain object internally) counted as truthy; 2.2
      // flipped this, but 2.0 is the parity target.
      const result = await evalCore(
        '$sift(o, function($v) { function($x){$x} })',
        { o: { a: 1, b: 2 } }
      )
      expect(result).toEqual({ a: 1, b: 2 })
    })
  })

  describe('null-safety (the reason for the overrides)', () => {
    it('$each returns undefined for missing input', async () => {
      expect(
        await evalCore('$each(o.missing, function($v) { $v })', { o: {} })
      ).toBeUndefined()
    })

    it('$sift returns undefined for missing input', async () => {
      expect(
        await evalCore('$sift(o.missing, function($v) { $v })', { o: {} })
      ).toBeUndefined()
    })
  })

  describe('builtin result-shape parity', () => {
    it('$each unwraps a single result like a singleton sequence', async () => {
      expect(
        await evalCore('$each(o, function($v, $k) { $k = "a" ? $v })', {
          o: { a: 42, b: 2 },
        })
      ).toBe(42)
    })

    it('$sift returns undefined when nothing survives', async () => {
      expect(
        await evalCore('$sift(o, function($v) { $v > 10 })', {
          o: { a: 1 },
        })
      ).toBeUndefined()
    })
  })
})
