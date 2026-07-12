import type { EvidenceItem, EvidenceItemKind } from '../../state/boardTypes'
import { CORK_FRONT_Z } from '../Board'

/** Static per-kind visual configuration: footprint, base color, and paper thickness. */
export interface ItemVisualConfig {
  width: number
  height: number
  thickness: number
  baseColor: string
  /** Whether this kind renders an uploaded/placeholder image on its face. */
  showsImage: boolean
}

export const ITEM_VISUALS: Record<EvidenceItemKind, ItemVisualConfig> = {
  photo: { width: 3.2, height: 2.4, thickness: 0.06, baseColor: '#f5f2e9', showsImage: true },
  'sticky-note': { width: 2.2, height: 2.2, thickness: 0.05, baseColor: '#f5df6e', showsImage: false },
  'suspect-card': { width: 2.6, height: 3.3, thickness: 0.07, baseColor: '#efe7d6', showsImage: true },
  'location-card': { width: 2.9, height: 2.1, thickness: 0.06, baseColor: '#e6ddc3', showsImage: false },
  'newspaper-clipping': { width: 3.4, height: 2.7, thickness: 0.04, baseColor: '#e9e0c4', showsImage: false },
  fingerprint: { width: 1.8, height: 1.8, thickness: 0.05, baseColor: '#f2efe6', showsImage: false },
  'document-file': { width: 2.6, height: 3.2, thickness: 0.14, baseColor: '#d8bf85', showsImage: false },
}

/** A handful of sticky-note colors, chosen deterministically from the item id so re-renders stay stable. */
const STICKY_COLORS = ['#f5df6e', '#f5a6c6', '#8fd3f4', '#b7e07c']

export function stickyColorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return STICKY_COLORS[hash % STICKY_COLORS.length]
}

/**
 * World-space position of an item's pushpin — the point ropes attach to.
 *
 * Deliberately ignores the item's small random `rotation` (a cosmetic
 * "messy desk" tilt): ropes sway continuously anyway, so the sub-degree
 * anchor error this introduces is imperceptible, and skipping the rotation
 * transform keeps this a cheap, allocation-free call for the rope
 * simulation to make every frame.
 */
export function getItemPinWorldPosition(item: EvidenceItem): [number, number, number] {
  const visual = ITEM_VISUALS[item.kind]
  return [item.position.x, item.position.y + visual.height / 2 - 0.05, CORK_FRONT_Z + visual.thickness + 0.05]
}
