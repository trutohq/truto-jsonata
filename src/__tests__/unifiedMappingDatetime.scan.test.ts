import vendoredExpressions from './fixtures/datetime-mapping-expressions.json'
import { DATETIME_SCAN_FIXTURE } from './helpers/unifiedModelScan'
import { smokeEvaluateMapping } from './helpers/smokeEvaluateMapping'
import { describe, it } from 'vitest'

describe('Vendored unified-mapping datetime snippets (from production YAML)', () => {
  it.each(vendoredExpressions)(
    'has no JSONata 2.2 wrapper regression: %s',
    async expression => {
      await smokeEvaluateMapping(expression, DATETIME_SCAN_FIXTURE)
    }
  )
})
