import { omit, sortBy, get } from 'lodash-es'

// Define a type for the nodes to make it more explicit
export type Node = {
  [key: string]: any // Allow additional attributes
  id: string | number
  parent_id?: string | number | null
  sequence: number
  children?: Node[]
}

export function sortNodes(
  array: Node[],
  idKey = 'id',
  parentIdKey = 'parent_id',
  sequenceKey = 'sequence',
): Node[] {
  // Step 1: Create a Map for quick lookup of nodes by their id
  const nodeMap = new Map<string | number, Node>()

  // Populate the map
  array.forEach(node => {
    nodeMap.set(get(node, idKey), { ...node, children: [] })
  })

  // Step 2: Create an array to hold the root nodes
  const rootNodes: Node[] = []

  // Step 3: Organize the nodes into a tree structure
  array.forEach(node => {
    const parentId = get(node, parentIdKey)
    const nodeId = get(node, idKey)
    if (parentId && nodeMap.has(parentId)) {
      // If the parent exists, add the current node as a child
      nodeMap.get(parentId)?.children?.push(nodeMap.get(nodeId)!)
    } else {
      // Treat it as a root node if the parent doesn't exist or it's null
      rootNodes.push(nodeMap.get(nodeId)!)
    }
  })

  // Step 4: Recursive function to sort nodes and their children
  function sortTree(nodes: Node[]): Node[] {
    // Sort nodes using lodash by sequence
    const sortedNodes = sortBy(nodes, sequenceKey)
    sortedNodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        node.children = sortTree(node.children)
      }
    })
    return sortedNodes
  }

  // Step 5: Sort the root nodes and recursively sort their children
  const sortedTree = sortTree(rootNodes)

  // Step 6: Flatten the sorted tree into an array (keeping the parent-child structure)
  function flattenTree(nodes: Node[]): Node[] {
    return nodes.reduce<Node[]>((acc, node) => {
      acc.push(omit(node, 'children') as Node) // Push the current node without 'children'
      if (node.children && node.children.length > 0) {
        acc.push(...flattenTree(node.children)) // Recursively flatten children
      }
      return acc
    }, [])
  }

  return flattenTree(sortedTree)
}

export default sortNodes
