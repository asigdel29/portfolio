import { create } from 'zustand'

/**
 * Transient selection state.
 *
 * Deliberately separate from `boardStore` so that selecting/deselecting
 * items never creates undo/redo history entries.
 */
export interface SelectionStore {
  selectedItemIds: Set<string>
  hoveredItemId: string | null
  /** Item currently being dragged, if any; used by the rope/physics layer to know which body is kinematic. */
  draggingItemId: string | null
  /** Pin-to-pin rope draft in progress: the origin item id, or null when not connecting. */
  connectingFromItemId: string | null
  /** Item whose inline text editor (see `EvidenceCard`) is currently open, if any. */
  editingItemId: string | null

  select: (id: string, additive?: boolean) => void
  selectMany: (ids: string[], additive?: boolean) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void
  setDragging: (id: string | null) => void
  startConnecting: (id: string) => void
  cancelConnecting: () => void
  setEditing: (id: string | null) => void
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedItemIds: new Set(),
  hoveredItemId: null,
  draggingItemId: null,
  connectingFromItemId: null,
  editingItemId: null,

  select: (id, additive = false) =>
    set((s) => {
      if (additive) {
        const next = new Set(s.selectedItemIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return { selectedItemIds: next }
      }
      return { selectedItemIds: new Set([id]) }
    }),

  selectMany: (ids, additive = false) =>
    set((s) => ({
      selectedItemIds: additive ? new Set([...s.selectedItemIds, ...ids]) : new Set(ids),
    })),

  clearSelection: () => set({ selectedItemIds: new Set() }),
  setHovered: (id) => set({ hoveredItemId: id }),
  setDragging: (id) => set({ draggingItemId: id }),
  startConnecting: (id) => set({ connectingFromItemId: id }),
  cancelConnecting: () => set({ connectingFromItemId: null }),
  setEditing: (id) => set({ editingItemId: id }),
}))
