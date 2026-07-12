/**
 * Shared type definitions for the evidence board's persisted state.
 *
 * These types are intentionally plain data (no class instances, no functions)
 * so that the entire board state is trivially serializable to JSON for
 * save/load and safely diffable for undo/redo snapshots.
 */

/** Discriminates the visual/behavioral variant of an evidence item. */
export type EvidenceItemKind =
  | 'photo'
  | 'sticky-note'
  | 'suspect-card'
  | 'location-card'
  | 'newspaper-clipping'
  | 'fingerprint'
  | 'document-file'

/** A 2D position on the cork board plane (board-local coordinates, not world/screen space). */
export interface BoardPosition {
  x: number
  y: number
  /** Small z-offset used only to avoid z-fighting when items overlap; not user-controlled. */
  z: number
}

/**
 * AI-authored annotations attached to an item.
 *
 * These fields are never written by direct user interaction in phase 1 — they exist so
 * that the phase-2 agent has a stable schema and store slot to write into without
 * requiring a data-model migration. See `src/ai/metadata.ts`.
 */
export interface EvidenceMetadata {
  /** Free-form labels/tags proposed or confirmed for this item. */
  labels: string[]
  /** Id of a cluster this item has been grouped into by AI analysis, if any. */
  clusterId: string | null
  /** Natural-language hypotheses referencing this item. */
  hypotheses: string[]
  /** Optional position in an inferred timeline (ISO 8601 or free text; agent-defined). */
  timelineSlot: string | null
}

/** A single evidence item pinned to the board. */
export interface EvidenceItem {
  id: string
  kind: EvidenceItemKind
  position: BoardPosition
  /** Rotation around the board normal (radians), applied for the "messy desk" look. */
  rotation: number
  /** User-editable title/caption shown on the item. */
  label: string
  /** Free-form body text (sticky notes, suspect card notes, document contents excerpt). */
  text: string
  /** Object URL or data URL for uploaded imagery (photo items only). */
  imageUrl: string | null
  metadata: EvidenceMetadata
}

/** A connection ("string") between two evidence items, rendered as a physical rope. */
export interface RopeConnection {
  id: string
  fromItemId: string
  toItemId: string
  /** User-assigned label describing the relationship (e.g. "alibi conflicts with"). */
  label: string
  /** Subjective strength of the connection in [0, 1]; drives visual thickness/opacity. */
  strength: number
  /** Visual material preset for the rope. */
  material: 'red-yarn' | 'twine' | 'nylon' | 'cotton-thread'
}

/** The complete serializable board state. */
export interface BoardState {
  /** User-editable board/case title, shown in the top bar. */
  title: string
  items: Record<string, EvidenceItem>
  ropes: Record<string, RopeConnection>
  /** Insertion-ordered id lists, kept separate from the maps above for stable iteration/z-order. */
  itemOrder: string[]
  ropeOrder: string[]
}

/** Creates a fresh, empty board state. */
export function createEmptyBoardState(): BoardState {
  return {
    title: 'Untitled Case',
    items: {},
    ropes: {},
    itemOrder: [],
    ropeOrder: [],
  }
}

/** Creates a fresh, empty metadata block for a new item. */
export function createEmptyMetadata(): EvidenceMetadata {
  return {
    labels: [],
    clusterId: null,
    hypotheses: [],
    timelineSlot: null,
  }
}
