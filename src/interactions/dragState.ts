import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'

/**
 * Mutable, module-level drag state.
 *
 * This intentionally lives outside React/Zustand reactivity: while a drag is
 * in progress, `DragController` reads and writes it once per animation
 * frame via `useFrame`, and per-frame writes must not trigger component
 * re-renders (only the final `boardStore.moveItems` commit should).
 */
interface DragState {
  /** Ids of all items being dragged together (the drag origin item plus any co-selected items). */
  itemIds: string[]
  /** Board-point offset from the pointer to each item's origin, keyed by item id, captured at drag start. */
  offsets: Map<string, { x: number; y: number }>
}

const dragState: DragState = { itemIds: [], offsets: new Map() }

/**
 * Begins a drag gesture for `primaryItemId`. If the item is part of the
 * current multi-selection, the whole selection moves together; otherwise
 * only the clicked item moves and selection collapses to just that item.
 */
export function beginItemDrag(primaryItemId: string, pointerBoardPoint: { x: number; y: number }) {
  const selection = useSelectionStore.getState()
  const board = useBoardStore.getState()

  const dragging = selection.selectedItemIds.has(primaryItemId)
    ? Array.from(selection.selectedItemIds)
    : [primaryItemId]

  if (!selection.selectedItemIds.has(primaryItemId)) {
    selection.select(primaryItemId)
  }

  dragState.itemIds = dragging
  dragState.offsets = new Map(
    dragging.map((id) => {
      const item = board.items[id]
      return [id, { x: (item?.position.x ?? 0) - pointerBoardPoint.x, y: (item?.position.y ?? 0) - pointerBoardPoint.y }]
    }),
  )
  selection.setDragging(primaryItemId)
}

/** Applies the current pointer board-point to all items in the active drag, preserving their captured offsets. */
export function updateItemDrag(pointerBoardPoint: { x: number; y: number }) {
  if (dragState.itemIds.length === 0) return
  const moves = dragState.itemIds.map((id) => {
    const offset = dragState.offsets.get(id) ?? { x: 0, y: 0 }
    return { id, position: { x: pointerBoardPoint.x + offset.x, y: pointerBoardPoint.y + offset.y } }
  })
  useBoardStore.getState().moveItems(moves)
}

/** Ends the current drag gesture, if any. Safe to call even when no drag is in progress. */
export function endItemDrag() {
  dragState.itemIds = []
  dragState.offsets.clear()
  useSelectionStore.getState().setDragging(null)
}

export function isDragging(): boolean {
  return dragState.itemIds.length > 0
}
