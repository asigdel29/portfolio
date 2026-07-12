import * as THREE from 'three'
import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'
import { getActiveCamera, getActiveDomElement } from '../engine/picking/activeCamera'

/**
 * Rectangular marquee selection ("lasso" in the toolbar — a true free-form
 * polygon lasso was scoped out for build time; a screen-space rectangle
 * covers the same practical need of "select everything in this area").
 *
 * Mirrors the `connectMode.ts` pattern: a module-level tool-mode toggle plus
 * plain functions the 2D `LassoOverlay` component drives from raw pointer
 * events, since the marquee rectangle itself is DOM/screen-space UI, not a
 * 3D scene object.
 */
let lassoModeActive = false

export function isLassoModeActive(): boolean {
  return lassoModeActive
}

export function setLassoMode(active: boolean) {
  lassoModeActive = active
}

export interface MarqueeRect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * Selects every board item whose pin position projects into `rectPx`
 * (page-space pixels, as produced by pointer events).
 */
export function selectItemsInMarquee(rectPx: MarqueeRect, additive: boolean) {
  const camera = getActiveCamera()
  const canvas = getActiveDomElement()
  if (!camera || !canvas) return

  const canvasRect = canvas.getBoundingClientRect()
  const minX = Math.min(rectPx.x0, rectPx.x1)
  const maxX = Math.max(rectPx.x0, rectPx.x1)
  const minY = Math.min(rectPx.y0, rectPx.y1)
  const maxY = Math.max(rectPx.y0, rectPx.y1)

  const board = useBoardStore.getState()
  const hitIds: string[] = []
  const projected = new THREE.Vector3()

  for (const id of board.itemOrder) {
    const item = board.items[id]
    if (!item) continue
    projected.set(item.position.x, item.position.y, item.position.z).project(camera)
    const screenX = canvasRect.left + ((projected.x + 1) / 2) * canvasRect.width
    const screenY = canvasRect.top + ((1 - projected.y) / 2) * canvasRect.height
    if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
      hitIds.push(id)
    }
  }

  useSelectionStore.getState().selectMany(hitIds, additive)
}
