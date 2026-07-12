import type { RopeConnection } from './boardTypes'

/** Base tube radius and tint per rope material preset. */
export const ROPE_MATERIAL_PRESETS: Record<RopeConnection['material'], { color: string; radius: number; roughness: number }> = {
  'red-yarn': { color: '#b5222c', radius: 0.028, roughness: 0.95 },
  twine: { color: '#c2a877', radius: 0.032, roughness: 0.9 },
  nylon: { color: '#eef0ee', radius: 0.02, roughness: 0.35 },
  'cotton-thread': { color: '#f2efe6', radius: 0.016, roughness: 0.85 },
}
