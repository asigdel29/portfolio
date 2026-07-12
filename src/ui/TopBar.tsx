import { useBoardStore } from '../state/boardStore'

/**
 * Top chrome bar: editable board/case title.
 *
 * Deliberately omits collaboration UI (avatars, share, notifications) —
 * this is a single-user tool with no backend, and fabricating multiplayer
 * chrome would misrepresent what the app actually does.
 */
export function TopBar() {
  const title = useBoardStore((s) => s.title)
  const setTitle = useBoardStore((s) => s.setTitle)

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
    </div>
  )
}
