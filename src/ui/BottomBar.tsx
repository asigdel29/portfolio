import { useCameraStore } from '../state/cameraStore'
import { requestZoom, requestResetView } from '../interactions/zoomState'

/** Bottom-center zoom control bar: zoom out/in and a percentage readout that resets the view when clicked. */
export function BottomBar() {
  const zoom = useCameraStore((s) => s.zoom)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(20, 18, 16, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: 6,
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}
    >
      <button onClick={() => requestZoom(1 / 1.2)} title="Zoom out" style={buttonStyle}>
        −
      </button>
      <button
        onClick={requestResetView}
        title="Reset view"
        style={{ ...buttonStyle, width: 56, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => requestZoom(1.2)} title="Zoom in" style={buttonStyle}>
        +
      </button>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 'none',
  background: 'rgba(255,255,255,0.06)',
  color: '#eee',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
}
