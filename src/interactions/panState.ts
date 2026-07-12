/**
 * Module-level camera pan/zoom pointer-tracking state.
 *
 * Pan gestures must only begin when a pointer-down genuinely lands on bare
 * board (not on an evidence item in front of it). Item meshes call
 * `event.stopPropagation()` on their own `onPointerDown`, which — because
 * this state is started from the cork mesh's R3F `onPointerDown` handler
 * rather than a raw `addEventListener('pointerdown', ...)` on the canvas —
 * naturally never fires when an item intercepts the click first. A raw
 * listener race here previously caused clicking an item to also pan the
 * camera; see `CameraRig.tsx`.
 */
interface PanPointerState {
  active: boolean
  lastClientX: number
  lastClientY: number
}

const panPointer: PanPointerState = { active: false, lastClientX: 0, lastClientY: 0 }

export function beginPan(clientX: number, clientY: number) {
  panPointer.active = true
  panPointer.lastClientX = clientX
  panPointer.lastClientY = clientY
}

export function isPanning(): boolean {
  return panPointer.active
}

/** Returns the pointer's screen-space delta since the last call and updates the tracked position. */
export function consumePanDelta(clientX: number, clientY: number): { dx: number; dy: number } {
  const dx = clientX - panPointer.lastClientX
  const dy = clientY - panPointer.lastClientY
  panPointer.lastClientX = clientX
  panPointer.lastClientY = clientY
  return { dx, dy }
}

export function endPan() {
  panPointer.active = false
}
