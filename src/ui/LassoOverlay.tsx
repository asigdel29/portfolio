import { useState } from 'react'
import { useToolStore } from '../state/toolStore'
import { selectItemsInMarquee, type MarqueeRect } from '../interactions/lassoMode'

/**
 * Screen-space marquee-select overlay, active only while the lasso tool is
 * selected. Rendered as a transparent full-viewport div *above* the R3F
 * canvas so pointer events never reach the 3D scene while lassoing — this
 * sidesteps any need to reconcile marquee-start with per-item pointer
 * handlers underneath.
 */
export function LassoOverlay() {
  const activeTool = useToolStore((s) => s.activeTool)
  const [rect, setRect] = useState<MarqueeRect | null>(null)

  if (activeTool !== 'lasso') return null

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setRect({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY })
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    setRect((prev) => (prev ? { ...prev, x1: e.clientX, y1: e.clientY } : prev))
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (rect) selectItemsInMarquee(rect, e.shiftKey)
    setRect(null)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ position: 'fixed', inset: 0, cursor: 'crosshair', zIndex: 5 }}
    >
      {rect && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(rect.x0, rect.x1),
            top: Math.min(rect.y0, rect.y1),
            width: Math.abs(rect.x1 - rect.x0),
            height: Math.abs(rect.y1 - rect.y0),
            border: '1px solid #4da6ff',
            background: 'rgba(77,166,255,0.15)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
