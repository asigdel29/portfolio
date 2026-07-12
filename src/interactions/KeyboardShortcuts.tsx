import { useEffect } from 'react'
import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'
import { useToolStore } from '../state/toolStore'

/**
 * Global keyboard shortcuts for the board: delete, duplicate, undo/redo,
 * and escape. Mounted once outside the canvas (plain `window` listener —
 * none of this needs R3F's pointer/raycasting machinery).
 *
 * Shortcuts that could conflict with normal text entry (Delete, Cmd+D) are
 * suppressed whenever the event target is an `<input>`/`<textarea>` — most
 * relevantly the inline sticky-note editor in `EvidenceCard`.
 */
export function KeyboardShortcuts() {
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    }

    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      if (e.key === 'Escape') {
        useSelectionStore.getState().clearSelection()
        useSelectionStore.getState().cancelConnecting()
        useSelectionStore.getState().setEditing(null)
        useToolStore.getState().setActiveTool('select')
        return
      }

      if (isTypingTarget(e.target)) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && !meta) {
        const ids = Array.from(useSelectionStore.getState().selectedItemIds)
        if (ids.length > 0) {
          e.preventDefault()
          useBoardStore.getState().removeItems(ids)
          useSelectionStore.getState().clearSelection()
        }
        return
      }

      if (meta && e.key.toLowerCase() === 'd') {
        const ids = Array.from(useSelectionStore.getState().selectedItemIds)
        if (ids.length > 0) {
          e.preventDefault()
          const newIds = useBoardStore.getState().duplicateItems(ids)
          useSelectionStore.getState().selectMany(newIds)
        }
        return
      }

      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        const temporal = useBoardStore.temporal.getState()
        if (e.shiftKey) temporal.redo()
        else temporal.undo()
        return
      }

      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        useBoardStore.temporal.getState().redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
