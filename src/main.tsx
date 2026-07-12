import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useBoardStore } from './state/boardStore'
import { useSelectionStore } from './state/selectionStore'
import { useCameraStore } from './state/cameraStore'

// Dev-only: expose stores for manual/scripted inspection in the browser console.
// Never included in production builds since this whole block is stripped by Vite's dead-code elimination.
if (import.meta.env.DEV) {
  Object.assign(window, {
    __board: useBoardStore,
    __selection: useSelectionStore,
    __camera: useCameraStore,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
