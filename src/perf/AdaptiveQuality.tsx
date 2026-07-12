import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useQualityStore } from '../state/qualityStore'

const SAMPLE_WINDOW = 90
const DOWNGRADE_FPS_THRESHOLD = 40
const UPGRADE_FPS_THRESHOLD = 55

/**
 * Watches a rolling window of frame times and downgrades (or restores)
 * `qualityStore`'s tier under sustained low/high frame rate.
 *
 * Thresholds are intentionally asymmetric (downgrade below 40fps, only
 * upgrade back above 55fps) so the tier doesn't flap at borderline frame
 * rates. Renders nothing — this is a monitoring-only component, mounted
 * once inside the canvas.
 */
export function AdaptiveQuality() {
  const frameTimesRef = useRef<number[]>([])

  useFrame((_state, delta) => {
    const samples = frameTimesRef.current
    samples.push(delta)
    if (samples.length > SAMPLE_WINDOW) samples.shift()
    if (samples.length < SAMPLE_WINDOW) return

    const avgDelta = samples.reduce((sum, d) => sum + d, 0) / samples.length
    const avgFps = 1 / avgDelta
    const { tier, setTier } = useQualityStore.getState()

    if (tier === 'high' && avgFps < DOWNGRADE_FPS_THRESHOLD) {
      setTier('low')
    } else if (tier === 'low' && avgFps > UPGRADE_FPS_THRESHOLD) {
      setTier('high')
    }
  })

  return null
}
