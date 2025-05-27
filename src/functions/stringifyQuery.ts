import qs from 'qs'

export default function stringifyQuery(
  query: Record<string, unknown>,
  options: Record<string, unknown>
) {
  return qs.stringify(query, options)
}
