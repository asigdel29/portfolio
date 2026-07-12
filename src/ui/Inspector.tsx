import { useState } from 'react'
import { useBoardStore } from '../state/boardStore'
import { useSelectionStore } from '../state/selectionStore'

/**
 * Right-side item inspector: shown whenever exactly one item is selected.
 * Lets the user rename the item, edit its note text, tag it, review/remove
 * its rope connections, and delete it outright — the board-editing
 * equivalent of the reference design's "ITEM" panel.
 */
export function Inspector() {
  const selectedIds = useSelectionStore((s) => s.selectedItemIds)
  const items = useBoardStore((s) => s.items)
  const ropes = useBoardStore((s) => s.ropes)
  const setItemLabel = useBoardStore((s) => s.setItemLabel)
  const setItemText = useBoardStore((s) => s.setItemText)
  const removeItem = useBoardStore((s) => s.removeItem)
  const removeRope = useBoardStore((s) => s.removeRope)
  const addItemTag = useBoardStore((s) => s.addItemTag)
  const removeItemTag = useBoardStore((s) => s.removeItemTag)
  const addItemHypothesis = useBoardStore((s) => s.addItemHypothesis)
  const removeItemHypothesis = useBoardStore((s) => s.removeItemHypothesis)
  const [tagDraft, setTagDraft] = useState('')
  const [hypothesisDraft, setHypothesisDraft] = useState('')

  if (selectedIds.size !== 1) return null
  const itemId = Array.from(selectedIds)[0]
  const item = items[itemId]
  if (!item) return null

  const connections = Object.values(ropes).filter((r) => r.fromItemId === itemId || r.toItemId === itemId)
  const evidenceStrength =
    connections.length > 0 ? connections.reduce((sum, r) => sum + r.strength, 0) / connections.length : 0

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 68,
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

      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
        />
      )}

      <label style={fieldLabelStyle}>
        Label
        <input value={item.label} onChange={(e) => setItemLabel(item.id, e.target.value)} style={inputStyle} />
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
        <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {item.metadata.labels.map((tag) => (
            <span
              key={tag}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {tag}
              <button
                onClick={() => removeItemTag(item.id, tag)}
                style={{ background: 'none', border: 'none', color: '#eee', cursor: 'pointer', opacity: 0.6, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagDraft.trim()) {
              addItemTag(item.id, tagDraft)
              setTagDraft('')
            }
          }}
          placeholder="Add a tag, press Enter"
          style={inputStyle}
        />
      </div>

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StrengthBar strength={rope.strength} />
                <button onClick={() => removeRope(rope.id)} style={smallButtonStyle} title="Remove connection">
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
          Hypotheses ({item.metadata.hypotheses.length})
        </div>
        {item.metadata.hypotheses.length === 0 && (
          <div style={{ opacity: 0.5, marginBottom: 6 }}>No hypotheses recorded — this slot is where AI-assisted reasoning attaches theories to evidence.</div>
        )}
        {item.metadata.hypotheses.map((h) => (
          <div key={h} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, padding: '4px 0', opacity: 0.9 }}>
            <span>{h}</span>
            <button onClick={() => removeItemHypothesis(item.id, h)} style={smallButtonStyle}>
              ✕
            </button>
          </div>
        ))}
        <input
          value={hypothesisDraft}
          onChange={(e) => setHypothesisDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hypothesisDraft.trim()) {
              addItemHypothesis(item.id, hypothesisDraft)
              setHypothesisDraft('')
            }
          }}
          placeholder="Add a hypothesis, press Enter"
          style={inputStyle}
        />
      </div>

      {connections.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
            Evidence Strength
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StrengthBar strength={evidenceStrength} segments={8} />
            <span style={{ fontSize: 12, opacity: 0.8 }}>{Math.round(evidenceStrength * 100)}%</span>
          </div>
        </div>
      )}

      <button
        onClick={() => removeItem(item.id)}
        style={{ ...smallButtonStyle, marginTop: 'auto', background: 'rgba(220,60,60,0.25)', width: '100%', padding: 8 }}
      >
        Delete Item
      </button>
    </div>
  )
}

/** A row of small filled/unfilled segments visualizing a [0,1] strength value, matching the reference design's evidence-strength meter. */
function StrengthBar({ strength, segments = 5 }: { strength: number; segments?: number }) {
  const filled = Math.round(strength * segments)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 6,
            borderRadius: 1,
            background: i < filled ? '#c62828' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
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
