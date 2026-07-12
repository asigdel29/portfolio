import { Analytics } from '@vercel/analytics/react'
import { Scene } from './scene/Scene'
import { Toolbar } from './ui/Toolbar'
import { Inspector } from './ui/Inspector'
import { LassoOverlay } from './ui/LassoOverlay'
import { KeyboardShortcuts } from './interactions/KeyboardShortcuts'

/**
 * Application root. The 3D evidence board fills the viewport; the 2D UI
 * overlay (toolbar, inspector, lasso marquee) is layered on top.
 */
function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Scene />
      <Toolbar />
      <Inspector />
      <LassoOverlay />
      <KeyboardShortcuts />
      <Analytics />
    </div>
  )
}

export default App
