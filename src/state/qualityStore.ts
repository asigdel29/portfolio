import { create } from 'zustand'

export type QualityTier = 'high' | 'low'

/** Rendering quality tier, downgraded automatically under sustained low frame rate (see `perf/AdaptiveQuality`). */
export const useQualityStore = create<{ tier: QualityTier; setTier: (tier: QualityTier) => void }>((set) => ({
  tier: 'high',
  setTier: (tier) => set({ tier }),
}))
