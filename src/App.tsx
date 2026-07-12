import { Scene } from './scene/Scene'
import { TopBar } from './ui/TopBar'
import { Toolbar } from './ui/Toolbar'
import { BottomBar } from './ui/BottomBar'
import { Inspector } from './ui/Inspector'
import { LassoOverlay } from './ui/LassoOverlay'
import { KeyboardShortcuts } from './interactions/KeyboardShortcuts'
import { AutosaveController } from './state/AutosaveController'

/**
 * Application root. The 3D evidence board fills the viewport; the 2D UI
 * overlay (top bar, toolbar, inspector, lasso marquee) is layered on top.
 */
function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Scene />
      <TopBar />
      <Toolbar />
      <BottomBar />
      <Inspector />
      <LassoOverlay />
      <KeyboardShortcuts />
      <AutosaveController />
    </div>
  )
}

export default App
