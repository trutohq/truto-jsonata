import { describe, expect, it } from 'vitest'
import { evalCore } from './helpers/jsonataEval'

// $each returns a jsonata sequence like the 2.0 builtin: an array with an own
// `sequence` flag. Compare the items only.
const items = (value: unknown) => Array.from(value as unknown[])

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
      expect(items(result)).toEqual(['a=1', 'b=2'])
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
      expect(items(result)).toEqual(['1', '2'])
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
      expect(items(result)).toEqual(['a:1/2', 'b:2/2'])
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

  // Inside a user-defined function body jsonata hands the callback over as a
  // raw procedure object, not a callable wrapper. Stored unified mappings
  // define helpers like `$bank := function($a) { $sift({...}, $nn) }`.
  describe('called inside a user-defined function', () => {
    it('$sift runs an inline lambda', async () => {
      expect(
        await evalCore(
          '($w := function($a) { $sift($a, function($v) { $v != null }) }; $w(o))',
          { o: { a: 1, b: null } }
        )
      ).toEqual({ a: 1 })
    })

    it('$each passes key and object to an inline lambda', async () => {
      expect(
        items(
          await evalCore(
            '($w := function($a) { $each($a, function($v, $k, $o) { $k & $count($keys($o)) }) }; $w(o))',
            { o: { a: 1, b: 2 } }
          )
        )
      ).toEqual(['a2', 'b2'])
    })

    it('uses a lambda bound outside, with closure variables in scope', async () => {
      expect(
        await evalCore(
          `(
            $min := 1;
            $keep := function($v) { $v > $min };
            $w := function($a) { $sift($a, $keep) };
            $w(o)
          )`,
          { o: { a: 1, b: 2 } }
        )
      ).toEqual({ b: 2 })
    })

    it('accepts a registered function as the callback', async () => {
      expect(
        items(
          await evalCore('($w := function($a) { $each($a, $string) }; $w(o))', {
            o: { a: 1, b: 2 },
          })
        )
      ).toEqual(['1', '2'])
    })

    it('rejects a wrong-typed registered callback with T0410, as at top level', async () => {
      await expect(
        evalCore('($w := function($a) { $each($a, $uppercase) }; $w(o))', {
          o: { a: 1 },
        })
      ).rejects.toMatchObject({ code: 'T0410' })
    })

    it('works in a nested helper reached through a path step', async () => {
      const result = (await evalCore(
        `(
          $nn := function($v) { $v != null and $v != [] };
          $row := function($a, $uid) { $sift({ "id": $a.id, "user": $uid, "x": $a.x }, $nn) };
          items.$row($, "u1")
        )`,
        { items: [{ id: 1 }, { id: 2, x: [] }] }
      )) as unknown[]
      expect(Array.from(result)).toEqual([
        { id: 1, user: 'u1' },
        { id: 2, user: 'u1' },
      ])
    })
  })
})
