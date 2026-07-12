import { useRef } from 'react'
import { useBoardStore } from '../state/boardStore'
import type { EvidenceItemKind } from '../state/boardTypes'
import { useCameraStore } from '../state/cameraStore'
import { useToolStore, type BoardTool } from '../state/toolStore'

const ADD_ACTIONS: Array<{ kind: EvidenceItemKind; label: string; icon: string }> = [
  { kind: 'photo', label: 'Photo', icon: '🖼' },
  { kind: 'sticky-note', label: 'Sticky Note', icon: '📝' },
  { kind: 'suspect-card', label: 'Suspect Card', icon: '👤' },
  { kind: 'location-card', label: 'Location Card', icon: '📍' },
  { kind: 'newspaper-clipping', label: 'Clipping', icon: '📰' },
  { kind: 'fingerprint', label: 'Fingerprint', icon: '🫆' },
  { kind: 'document-file', label: 'Document', icon: '📄' },
]

const TOOL_ACTIONS: Array<{ tool: BoardTool; label: string; icon: string }> = [
  { tool: 'select', label: 'Select', icon: '↖' },
  { tool: 'lasso', label: 'Lasso (marquee-select)', icon: '⬚' },
  { tool: 'connect', label: 'Connect (draw a rope between two items)', icon: '🔗' },
]

/**
 * Left-rail toolbar: tool selection (select/lasso/connect) plus buttons for
 * adding evidence items and uploading photos. New items are dropped near
 * the current camera target so they always appear in view regardless of
 * how far the user has panned.
 */
export function Toolbar() {
  const addItem = useBoardStore((s) => s.addItem)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingUploadItemId = useRef<string | null>(null)
  const setItemImage = useBoardStore((s) => s.setItemImage)
  const activeTool = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)

  function spawnPosition() {
    const target = useCameraStore.getState().target
    return { x: target.x + (Math.random() - 0.5) * 3, y: target.y + (Math.random() - 0.5) * 2 }
  }

  function handleAdd(kind: EvidenceItemKind) {
    if (kind === 'photo') {
      const id = addItem(kind, spawnPosition())
      pendingUploadItemId.current = id
      fileInputRef.current?.click()
      return
    }
    addItem(kind, spawnPosition())
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const itemId = pendingUploadItemId.current
    if (file && itemId) {
      // A data URL (not `URL.createObjectURL`) so the image survives JSON export and
      // localStorage autosave — object URLs are only valid for the current page session.
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') setItemImage(itemId, reader.result)
      }
      reader.readAsDataURL(file)
    }
    pendingUploadItemId.current = null
    e.target.value = ''
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'rgba(20, 18, 16, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 8,
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}
    >
      {TOOL_ACTIONS.map((action) => (
        <button
          key={action.tool}
          onClick={() => setActiveTool(activeTool === action.tool ? 'select' : action.tool)}
          title={action.label}
          style={{
            ...buttonStyle,
            background: activeTool === action.tool ? 'rgba(255,92,51,0.35)' : buttonStyle.background,
          }}
        >
          <span style={{ fontSize: 18 }}>{action.icon}</span>
        </button>
      ))}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 4px' }} />
      {ADD_ACTIONS.map((action) => (
        <button
          key={action.kind}
          onClick={() => handleAdd(action.kind)}
          title={`Add ${action.label}`}
          style={buttonStyle}
        >
          <span style={{ fontSize: 18 }}>{action.icon}</span>
        </button>
      ))}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.06)',
  color: '#eee',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
