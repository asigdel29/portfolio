import { useEffect } from 'react'
import { useBoardStore } from './boardStore'
import { saveBoardToLocalStorage, loadBoardFromLocalStorage } from './serialization'

const AUTOSAVE_DEBOUNCE_MS = 800

/**
 * Loads any previously autosaved board on mount, then keeps localStorage in
 * sync with the live board thereafter (debounced, so rapid changes like a
 * drag-in-progress don't write on every frame).
 *
 * Renders nothing — this is a side-effect-only component, mounted once near
 * the app root.
 */
export function AutosaveController() {
  useEffect(() => {
    const saved = loadBoardFromLocalStorage()
    if (saved) useBoardStore.getState().loadBoard(saved)

    let timeout: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useBoardStore.subscribe((state) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => saveBoardToLocalStorage(state), AUTOSAVE_DEBOUNCE_MS)
    })

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  return null
}
