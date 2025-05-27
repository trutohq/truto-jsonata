import qs from 'qs'

export default function parseQuery(
  query: string,
  options: Record<string, unknown>
) {
  return qs.parse(query, options)
}
