import type { DepGraph } from 'dependency-graph'
import { NATIVE_DEP_GRAPH } from './unwrapNative'

export type JsonataDepGraph = ReturnType<typeof toJsonataDepGraph>

export function toJsonataDepGraph<T>(graph: DepGraph<T>) {
  return {
    overallOrder: (leaveEdges?: boolean) => graph.overallOrder(leaveEdges),
    dependenciesOf: (node: string) => graph.dependenciesOf(node),
    dependantsOf: (node: string) => graph.dependantsOf(node),
    hasNode: (node: string) => graph.hasNode(node),
    getNodeData: (node: string) => graph.getNodeData(node),
    clone: () => toJsonataDepGraph(graph.clone()),
    [NATIVE_DEP_GRAPH]: graph,
  }
}
