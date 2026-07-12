import { useRef } from 'react'
import { useBoardStore } from '../state/boardStore'
import { downloadBoard, readBoardFromFile } from '../state/serialization'

/**
 * Top chrome bar: editable board/case title, plus export/import for the
 * board's JSON representation.
 *
 * Deliberately omits collaboration UI (avatars, share, notifications) —
 * this is a single-user tool with no backend, and fabricating multiplayer
 * chrome would misrepresent what the app actually does.
 */
export function TopBar() {
  const title = useBoardStore((s) => s.title)
  const setTitle = useBoardStore((s) => s.setTitle)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const board = await readBoardFromFile(file)
    if (board) useBoardStore.getState().loadBoard(board)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        background: 'rgba(14, 12, 10, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        color: '#eee',
        fontSize: 14,
        zIndex: 10,
      }}
    >
      <span style={{ fontWeight: 700, letterSpacing: 1.5, fontSize: 13, opacity: 0.85 }}>CASEBOOK</span>
      <span style={{ opacity: 0.3 }}>/</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#eee',
          fontSize: 14,
          fontWeight: 500,
          minWidth: 120,
        }}
      />

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button onClick={() => fileInputRef.current?.click()} title="Import a .casebook.json file" style={chipButtonStyle}>
          Import
        </button>
        <button onClick={() => downloadBoard(useBoardStore.getState())} title="Export this board as JSON" style={chipButtonStyle}>
          Export
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
    </div>
  )
}

const chipButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#eee',
  cursor: 'pointer',
  padding: '5px 12px',
  fontSize: 12,
}
