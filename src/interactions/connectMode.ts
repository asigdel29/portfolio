import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'

/**
 * Module-level toggle for "connect" tool mode (see the left-rail toolbar).
 *
 * While active, clicking an evidence item starts or completes a rope
 * connection instead of starting a drag; see `handleItemClickForConnect`,
 * called from `EvidenceCard`'s pointer-down handler.
 */
let connectModeActive = false

export function isConnectModeActive(): boolean {
  return connectModeActive
}

export function setConnectMode(active: boolean) {
  connectModeActive = active
  if (!active) useSelectionStore.getState().cancelConnecting()
}

/**
 * Handles a click on `itemId` while connect mode is active: the first click
 * marks the origin item, the second (on a different item) creates the rope
 * and returns connect mode to its origin-picking state so multiple ropes
 * can be drawn in quick succession without re-toggling the tool.
 */
export function handleItemClickForConnect(itemId: string) {
  const selection = useSelectionStore.getState()
  const originId = selection.connectingFromItemId
  if (!originId) {
    selection.startConnecting(itemId)
    return
  }
  if (originId === itemId) {
    selection.cancelConnecting()
    return
  }
  useBoardStore.getState().addRope(originId, itemId)
  selection.cancelConnecting()
}
