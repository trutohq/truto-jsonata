import { DepGraph } from 'dependency-graph'
import { get, keyBy } from 'lodash'

const dependencyGraph = (array: unknown[], parentKey: string, key: string) => {
  const graph = new DepGraph()
  const keyedArray = keyBy(array, item => get(item, key))
  array.forEach(item => {
    const parentValue = get(item, parentKey)
    const value = get(item, key)
    if (!graph.hasNode(value)) {
      graph.addNode(value, item)
    }
    if (keyedArray[parentValue]) {
      if (!graph.hasNode(parentValue)) {
        graph.addNode(parentValue, keyedArray[parentValue])
      }
      graph.addDependency(value, parentValue)
    }
  })
  return graph
}

export default dependencyGraph
