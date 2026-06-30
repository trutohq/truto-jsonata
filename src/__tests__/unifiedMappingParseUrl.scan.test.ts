import vendoredExpressions from './fixtures/parseUrl-mapping-expressions.json'
import { PARSE_URL_SCAN_FIXTURE } from './helpers/unifiedModelScan'
import { smokeEvaluateMapping } from './helpers/smokeEvaluateMapping'
import { describe, it } from 'vitest'

describe('Vendored unified-mapping parseUrl snippets (from production YAML)', () => {
  it.each(vendoredExpressions)(
    'has no JSONata 2.2 wrapper regression: %s',
    async expression => {
      await smokeEvaluateMapping(expression, PARSE_URL_SCAN_FIXTURE)
    }
  )
})
