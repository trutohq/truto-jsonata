import type { DepGraph } from 'dependency-graph'
import { NATIVE_DEP_GRAPH } from './unwrapNative'

export function toJsonataDepGraph<T>(graph: DepGraph<T>) {
  const value = {
    overallOrder: (leaveEdges?: boolean) => graph.overallOrder(leaveEdges),
    dependenciesOf: (node: string) => graph.dependenciesOf(node),
    dependantsOf: (node: string) => graph.dependantsOf(node),
    hasNode: (node: string) => graph.hasNode(node),
    getNodeData: (node: string) => graph.getNodeData(node),
    clone: () => toJsonataDepGraph(graph.clone()),
  }
  Object.defineProperty(value, NATIVE_DEP_GRAPH, {
    value: graph,
    enumerable: false,
  })
  return value
}
