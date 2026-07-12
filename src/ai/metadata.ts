import type { BoardState } from '../state/boardTypes'

/**
 * Read-only derivations over the board's connection graph and AI-authored
 * metadata (see `EvidenceMetadata` in `state/boardTypes.ts`).
 *
 * This module is the contract phase-2's agent integration writes against:
 * the agent proposes labels, clusters, hypotheses, and timeline slots via
 * the existing `boardStore` mutation actions (`addItemTag`, `setItemCluster`,
 * `addItemHypothesis`, `setItemTimelineSlot`), and reads the board's shape
 * back out through the functions here. Keeping these as pure functions over
 * `BoardState` (rather than reaching into the store directly) means an
 * agent — or a test — can reason about a board snapshot without a live
 * Zustand instance.
 */

/** Adjacency map: item id -> the set of item ids it has a direct rope connection to. */
export type ConnectionGraph = Map<string, Set<string>>

export function buildConnectionGraph(board: BoardState): ConnectionGraph {
  const graph: ConnectionGraph = new Map()
  for (const id of board.itemOrder) graph.set(id, new Set())
  for (const rope of Object.values(board.ropes)) {
    graph.get(rope.fromItemId)?.add(rope.toItemId)
    graph.get(rope.toItemId)?.add(rope.fromItemId)
  }
  return graph
}

/** Item ids reachable from `itemId` by any chain of connections (breadth-first, excludes `itemId` itself). */
export function getConnectedComponent(board: BoardState, itemId: string): Set<string> {
  const graph = buildConnectionGraph(board)
  const visited = new Set<string>()
  const queue = [itemId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const neighbor of graph.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  return visited
}

/** Groups items by their AI-assigned `metadata.clusterId`, ignoring items with no cluster. */
export function getClusters(board: BoardState): Map<string, string[]> {
  const clusters = new Map<string, string[]>()
  for (const id of board.itemOrder) {
    const clusterId = board.items[id]?.metadata.clusterId
    if (!clusterId) continue
    const members = clusters.get(clusterId) ?? []
    members.push(id)
    clusters.set(clusterId, members)
  }
  return clusters
}

/** All hypotheses across the board, paired with the item they're attached to, in item order. */
export function getAllHypotheses(board: BoardState): Array<{ itemId: string; hypothesis: string }> {
  const results: Array<{ itemId: string; hypothesis: string }> = []
  for (const id of board.itemOrder) {
    for (const hypothesis of board.items[id]?.metadata.hypotheses ?? []) {
      results.push({ itemId: id, hypothesis })
    }
  }
  return results
}
