import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'

/**
 * Right-side item inspector: shown whenever exactly one item is selected.
 * Lets the user rename the item, edit its note text, review/remove its rope
 * connections, and delete it outright — the board-editing equivalent of the
 * reference design's "ITEM" panel.
 */
export function Inspector() {
  const selectedIds = useSelectionStore((s) => s.selectedItemIds)
  const items = useBoardStore((s) => s.items)
  const ropes = useBoardStore((s) => s.ropes)
  const setItemLabel = useBoardStore((s) => s.setItemLabel)
  const setItemText = useBoardStore((s) => s.setItemText)
  const removeItem = useBoardStore((s) => s.removeItem)
  const removeRope = useBoardStore((s) => s.removeRope)

  if (selectedIds.size !== 1) return null
  const itemId = Array.from(selectedIds)[0]
  const item = items[itemId]
  if (!item) return null

  const connections = Object.values(ropes).filter((r) => r.fromItemId === itemId || r.toItemId === itemId)

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        bottom: 16,
        width: 280,
        background: 'rgba(20, 18, 16, 0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        backdropFilter: 'blur(8px)',
        color: '#eee',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase' }}>{item.kind.replace('-', ' ')}</div>

      <label style={fieldLabelStyle}>
        Label
        <input
          value={item.label}
          onChange={(e) => setItemLabel(item.id, e.target.value)}
          style={inputStyle}
        />
      </label>

      <label style={fieldLabelStyle}>
        Notes
        <textarea
          value={item.text}
          onChange={(e) => setItemText(item.id, e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <div>
        <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
          Connections ({connections.length})
        </div>
        {connections.length === 0 && <div style={{ opacity: 0.5 }}>No connections yet.</div>}
        {connections.map((rope) => {
          const otherId = rope.fromItemId === itemId ? rope.toItemId : rope.fromItemId
          const other = items[otherId]
          return (
            <div
              key={rope.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span>{other?.label || other?.kind || 'Unknown'}</span>
              <button onClick={() => removeRope(rope.id)} style={smallButtonStyle} title="Remove connection">
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => removeItem(item.id)}
        style={{ ...smallButtonStyle, marginTop: 'auto', background: 'rgba(220,60,60,0.25)', width: '100%', padding: 8 }}
      >
        Delete Item
      </button>
    </div>
  )
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  letterSpacing: 0.5,
  opacity: 0.7,
  textTransform: 'uppercase',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: '6px 8px',
  color: '#eee',
  fontSize: 13,
  fontFamily: 'inherit',
  textTransform: 'none',
  letterSpacing: 'normal',
}

const smallButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  borderRadius: 4,
  color: '#eee',
  cursor: 'pointer',
  padding: '2px 8px',
}
