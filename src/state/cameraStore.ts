import { create } from 'zustand'

/**
 * Transient camera state driving the Miro-style pan/zoom rig.
 *
 * `target` is the board-plane point the camera looks at; `zoom` is a
 * unitless distance multiplier (1 = default framing, smaller = closer).
 * `CameraRig` reads and writes this store; it is never part of undo/redo.
 */
export interface CameraStore {
  target: { x: number; y: number }
  zoom: number
  setTarget: (target: { x: number; y: number }) => void
  setZoom: (zoom: number) => void
}

export const MIN_ZOOM = 0.35
export const MAX_ZOOM = 2.5

export const useCameraStore = create<CameraStore>((set) => ({
  target: { x: 0, y: 0 },
  zoom: 1,
  setTarget: (target) => set({ target }),
  setZoom: (zoom) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) }),
}))
