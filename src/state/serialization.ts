import type { BoardState } from './boardTypes'

const AUTOSAVE_KEY = 'casebook:board'
const AUTOSAVE_VERSION = 1

interface AutosaveEnvelope {
  version: number
  board: BoardState
}

/** Serializes a board to a JSON string. The board type is already plain data, so this is a direct stringify. */
export function serializeBoard(board: BoardState): string {
  return JSON.stringify({ version: AUTOSAVE_VERSION, board } satisfies AutosaveEnvelope, null, 2)
}

/**
 * Parses a previously-serialized board. Returns `null` (rather than throwing) on malformed
 * input so callers — both localStorage autoload and file import — can fail soft and keep
 * whatever board state was already on screen.
 */
export function deserializeBoard(json: string): BoardState | null {
  try {
    const parsed = JSON.parse(json) as Partial<AutosaveEnvelope>
    if (!parsed || typeof parsed !== 'object' || !parsed.board) return null
    const board = parsed.board
    if (!board.items || !board.ropes || !Array.isArray(board.itemOrder) || !Array.isArray(board.ropeOrder)) return null
    return board
  } catch {
    return null
  }
}

export function saveBoardToLocalStorage(board: BoardState) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serializeBoard(board))
  } catch {
    // Storage can fail (quota exceeded, private browsing) — autosave is a convenience, not
    // a guarantee, so we silently drop the write rather than surface an error to the user.
  }
}

export function loadBoardFromLocalStorage(): BoardState | null {
  const raw = localStorage.getItem(AUTOSAVE_KEY)
  if (!raw) return null
  return deserializeBoard(raw)
}

/** Triggers a browser download of the board as a `.casebook.json` file. */
export function downloadBoard(board: BoardState) {
  const blob = new Blob([serializeBoard(board)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeName = board.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'case'
  link.download = `${safeName}.casebook.json`
  link.click()
  URL.revokeObjectURL(url)
}

/** Reads a user-selected file and resolves to the parsed board, or null if it wasn't a valid export. */
export function readBoardFromFile(file: File): Promise<BoardState | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? deserializeBoard(reader.result) : null)
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}
