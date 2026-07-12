/**
 * Module-level bridge for UI-triggered zoom/reset requests.
 *
 * `CameraRig` owns the actual zoom value (a ref driven every frame by wheel
 * input); external buttons (the bottom-bar zoom controls) can't reach into
 * that ref directly, so they queue a request here and `CameraRig` drains it
 * once per frame — the same "external code mutates a plain object,
 * `useFrame` consumes it" pattern used by `panState.ts` and `dragState.ts`.
 */
interface ZoomRequest {
  /** Multiplicative zoom change to apply, or null if none pending. */
  factor: number | null
  /** Whether a reset-to-default-framing was requested. */
  resetRequested: boolean
}

const zoomRequest: ZoomRequest = { factor: null, resetRequested: false }

export function requestZoom(factor: number) {
  zoomRequest.factor = (zoomRequest.factor ?? 1) * factor
}

export function requestResetView() {
  zoomRequest.resetRequested = true
  zoomRequest.factor = null
}

/** Drains any pending zoom/reset request. Returns null if nothing is pending. */
export function consumeZoomRequest(): ZoomRequest | null {
  if (zoomRequest.factor === null && !zoomRequest.resetRequested) return null
  const snapshot = { ...zoomRequest }
  zoomRequest.factor = null
  zoomRequest.resetRequested = false
  return snapshot
}
