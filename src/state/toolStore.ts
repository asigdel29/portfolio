import { create } from 'zustand'
import { setConnectMode } from '../interactions/connectMode'
import { setLassoMode } from '../interactions/lassoMode'

export type BoardTool = 'select' | 'connect' | 'lasso'

/**
 * The single active board tool, mutually exclusive by construction.
 *
 * `connectMode.ts` and `lassoMode.ts` keep their own module-level booleans
 * (read by non-React hot-path code — `EvidenceCard`'s pointer handler,
 * `Board`'s cork handler) for perf; this store is the reactive layer the
 * toolbar and overlays render from, and `setActiveTool` is the one place
 * that keeps both in sync.
 */
export interface ToolStore {
  activeTool: BoardTool
  setActiveTool: (tool: BoardTool) => void
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => {
    setConnectMode(tool === 'connect')
    setLassoMode(tool === 'lasso')
    set({ activeTool: tool })
  },
}))
