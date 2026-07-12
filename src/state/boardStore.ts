import { create } from 'zustand'
import { temporal } from 'zundo'
import {
  type BoardState,
  type EvidenceItem,
  type EvidenceItemKind,
  type RopeConnection,
  createEmptyBoardState,
  createEmptyMetadata,
} from './boardTypes'

/**
 * Actions that mutate the historied portion of the board (items + ropes).
 *
 * Every action here is captured by the zundo temporal middleware and is
 * therefore subject to undo/redo. Transient UI state (selection, camera,
 * drag-in-progress positions) intentionally lives outside this store — see
 * `selectionStore.ts` and `cameraStore.ts` — so that, e.g., moving the
 * camera or hovering an item never pollutes the undo stack.
 */
export interface BoardActions {
  setTitle: (title: string) => void
  addItem: (kind: EvidenceItemKind, position: { x: number; y: number }) => string
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  moveItem: (id: string, position: { x: number; y: number }) => void
  moveItems: (moves: Array<{ id: string; position: { x: number; y: number } }>) => void
  rotateItem: (id: string, rotation: number) => void
  duplicateItems: (ids: string[]) => string[]
  setItemLabel: (id: string, label: string) => void
  setItemText: (id: string, text: string) => void
  setItemImage: (id: string, imageUrl: string) => void
  addItemTag: (id: string, tag: string) => void
  removeItemTag: (id: string, tag: string) => void
  setItemCluster: (id: string, clusterId: string | null) => void
  addItemHypothesis: (id: string, hypothesis: string) => void
  removeItemHypothesis: (id: string, hypothesis: string) => void
  setItemTimelineSlot: (id: string, timelineSlot: string | null) => void

  addRope: (fromItemId: string, toItemId: string, material?: RopeConnection['material']) => string
  removeRope: (id: string) => void
  setRopeLabel: (id: string, label: string) => void
  setRopeStrength: (id: string, strength: number) => void

  /** Replaces the entire board (used by JSON import / load-from-storage). Not itself undoable-friendly by design — it clears history. */
  loadBoard: (state: BoardState) => void
  clearBoard: () => void
}

export type BoardStore = BoardState & BoardActions

let idCounter = 0
/**
 * Generates a short, collision-resistant id for a new item/rope.
 *
 * Deliberately avoids `crypto.randomUUID()` so ids stay stable and readable
 * during local debugging; uniqueness within a single board session is all
 * that's required since ids are never merged across sessions.
 */
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

const DEFAULT_ROPE_MATERIAL: RopeConnection['material'] = 'red-yarn'

export const useBoardStore = create<BoardStore>()(
  temporal(
    (set, get) => ({
      ...createEmptyBoardState(),

      setTitle: (title) => set({ title }),

      addItem: (kind, position) => {
        const id = nextId('item')
        // z is a tiny unique stacking offset (not a real depth) so items dropped at the same
        // spot don't z-fight; the scene layer adds the board's real front-face depth on top of this.
        const item: EvidenceItem = {
          id,
          kind,
          position: { x: position.x, y: position.y, z: get().itemOrder.length * 0.0015 },
          rotation: (Math.random() - 0.5) * 0.12,
          label: defaultLabelFor(kind),
          text: '',
          imageUrl: null,
          metadata: createEmptyMetadata(),
        }
        set((s) => ({
          items: { ...s.items, [id]: item },
          itemOrder: [...s.itemOrder, id],
        }))
        return id
      },

      removeItem: (id) => get().removeItems([id]),

      removeItems: (ids) => {
        const idSet = new Set(ids)
        set((s) => {
          const items = { ...s.items }
          for (const id of ids) delete items[id]
          const ropes = { ...s.ropes }
          const ropeOrder = s.ropeOrder.filter((rid) => {
            const rope = s.ropes[rid]
            const touchesRemoved = rope && (idSet.has(rope.fromItemId) || idSet.has(rope.toItemId))
            if (touchesRemoved) delete ropes[rid]
            return !touchesRemoved
          })
          return {
            items,
            itemOrder: s.itemOrder.filter((iid) => !idSet.has(iid)),
            ropes,
            ropeOrder,
          }
        })
      },

      moveItem: (id, position) => get().moveItems([{ id, position }]),

      moveItems: (moves) => {
        set((s) => {
          const items = { ...s.items }
          for (const { id, position } of moves) {
            const existing = items[id]
            if (!existing) continue
            items[id] = { ...existing, position: { ...existing.position, x: position.x, y: position.y } }
          }
          return { items }
        })
      },

      rotateItem: (id, rotation) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, rotation } } }
        })
      },

      duplicateItems: (ids) => {
        const newIds: string[] = []
        set((s) => {
          const items = { ...s.items }
          const itemOrder = [...s.itemOrder]
          for (const id of ids) {
            const source = s.items[id]
            if (!source) continue
            const newId = nextId('item')
            items[newId] = {
              ...source,
              id: newId,
              position: { x: source.position.x + 24, y: source.position.y + 24, z: source.position.z },
              metadata: { ...source.metadata, labels: [...source.metadata.labels], hypotheses: [...source.metadata.hypotheses] },
            }
            itemOrder.push(newId)
            newIds.push(newId)
          }
          return { items, itemOrder }
        })
        return newIds
      },

      setItemLabel: (id, label) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, label } } }
        })
      },

      setItemText: (id, text) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, text } } }
        })
      },

      setItemImage: (id, imageUrl) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, imageUrl } } }
        })
      },

      addItemTag: (id, tag) => {
        const trimmed = tag.trim()
        if (!trimmed) return
        set((s) => {
          const existing = s.items[id]
          if (!existing || existing.metadata.labels.includes(trimmed)) return s
          return {
            items: { ...s.items, [id]: { ...existing, metadata: { ...existing.metadata, labels: [...existing.metadata.labels, trimmed] } } },
          }
        })
      },

      removeItemTag: (id, tag) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return {
            items: {
              ...s.items,
              [id]: { ...existing, metadata: { ...existing.metadata, labels: existing.metadata.labels.filter((t) => t !== tag) } },
            },
          }
        })
      },

      setItemCluster: (id, clusterId) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, metadata: { ...existing.metadata, clusterId } } } }
        })
      },

      addItemHypothesis: (id, hypothesis) => {
        const trimmed = hypothesis.trim()
        if (!trimmed) return
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return {
            items: { ...s.items, [id]: { ...existing, metadata: { ...existing.metadata, hypotheses: [...existing.metadata.hypotheses, trimmed] } } },
          }
        })
      },

      removeItemHypothesis: (id, hypothesis) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return {
            items: {
              ...s.items,
              [id]: { ...existing, metadata: { ...existing.metadata, hypotheses: existing.metadata.hypotheses.filter((h) => h !== hypothesis) } },
            },
          }
        })
      },

      setItemTimelineSlot: (id, timelineSlot) => {
        set((s) => {
          const existing = s.items[id]
          if (!existing) return s
          return { items: { ...s.items, [id]: { ...existing, metadata: { ...existing.metadata, timelineSlot } } } }
        })
      },

      addRope: (fromItemId, toItemId, material = DEFAULT_ROPE_MATERIAL) => {
        const id = nextId('rope')
        const rope: RopeConnection = {
          id,
          fromItemId,
          toItemId,
          label: '',
          strength: 0.6,
          material,
        }
        set((s) => ({
          ropes: { ...s.ropes, [id]: rope },
          ropeOrder: [...s.ropeOrder, id],
        }))
        return id
      },

      removeRope: (id) => {
        set((s) => {
          const ropes = { ...s.ropes }
          delete ropes[id]
          return { ropes, ropeOrder: s.ropeOrder.filter((rid) => rid !== id) }
        })
      },

      setRopeLabel: (id, label) => {
        set((s) => {
          const existing = s.ropes[id]
          if (!existing) return s
          return { ropes: { ...s.ropes, [id]: { ...existing, label } } }
        })
      },

      setRopeStrength: (id, strength) => {
        set((s) => {
          const existing = s.ropes[id]
          if (!existing) return s
          return { ropes: { ...s.ropes, [id]: { ...existing, strength: Math.min(1, Math.max(0, strength)) } } }
        })
      },

      loadBoard: (state) => {
        set(() => ({ ...state }))
        useBoardStore.temporal.getState().clear()
      },

      clearBoard: () => {
        set(() => createEmptyBoardState())
        useBoardStore.temporal.getState().clear()
      },
    }),
    {
      // Only the pure board data is tracked for undo/redo; actions are excluded automatically
      // by zundo's partialize default (functions are stripped), so no explicit partialize is needed.
      limit: 100,
      equality: (a, b) => a === b,
    },
  ),
)

function defaultLabelFor(kind: EvidenceItemKind): string {
  switch (kind) {
    case 'photo':
      return 'Untitled Photo'
    case 'sticky-note':
      return ''
    case 'suspect-card':
      return 'Unknown Subject'
    case 'location-card':
      return 'Unknown Location'
    case 'newspaper-clipping':
      return 'Clipping'
    case 'fingerprint':
      return 'Print #' + Math.floor(Math.random() * 9000 + 1000)
    case 'document-file':
      return 'Document'
  }
}
