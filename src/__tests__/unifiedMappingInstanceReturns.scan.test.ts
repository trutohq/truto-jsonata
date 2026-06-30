import vendoredExpressions from './fixtures/instance-return-mapping-expressions.json'
import { INSTANCE_RETURN_SCAN_FIXTURE } from './helpers/unifiedModelScan'
import { smokeEvaluateMapping } from './helpers/smokeEvaluateMapping'
import { describe, it } from 'vitest'

describe('Vendored unified-mapping instance-return snippets (from production YAML)', () => {
  it.each(vendoredExpressions)(
    'has no JSONata 2.2 wrapper regression: %s',
    async expression => {
      await smokeEvaluateMapping(expression, INSTANCE_RETURN_SCAN_FIXTURE)
    }
  )
})
