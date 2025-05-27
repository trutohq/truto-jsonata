import qs from 'qs'

export default function parseQuery(query: string) {
  return qs.parse(query)
}