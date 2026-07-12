import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useCameraStore, MIN_ZOOM, MAX_ZOOM } from '../state/cameraStore'
import { beginPan, isPanning, consumePanDelta, endPan } from '../interactions/panState'
import { setActiveRenderContext } from '../engine/picking/activeCamera'

const BASE_DISTANCE = 48
const FOV_DEGREES = 28
/** Slight downward tilt so the board reads as "viewed from above a desk", per the design brief. */
const TILT_RADIANS = 0.12
const PAN_DAMPING = 0.14
const ZOOM_STEP = 0.0015

/**
 * Miro-style camera controller: click-drag pan with inertia, wheel/pinch zoom.
 *
 * Deliberately not `OrbitControls` — this rig only ever pans on the board's
 * XY plane and dollies along Z, which reads as 2.5D canvas navigation rather
 * than free 3D orbiting, matching the "collaborative canvas" brief.
 *
 * Pan gestures are started externally (see `interactions/panState.ts`) from
 * the cork board's own R3F pointer handler rather than a raw DOM listener on
 * the canvas, so that items in front of the cork correctly intercept clicks
 * via `stopPropagation()` instead of racing with a second, unrelated
 * listener on the same element.
 */
export function CameraRig() {
  const { camera, gl } = useThree()
  const targetRef = useRef(useCameraStore.getState().target)
  const zoomRef = useRef(useCameraStore.getState().zoom)
  const velocityRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setActiveRenderContext(camera, gl.domElement)
  }, [camera, gl])

  useEffect(() => {
    const el = gl.domElement

    function onPointerMove(e: PointerEvent) {
      if (!isPanning()) return
      const { dx, dy } = consumePanDelta(e.clientX, e.clientY)
      const worldPerPixel = visibleWidthAtTarget() / el.clientWidth
      const moveX = -dx * worldPerPixel
      const moveY = dy * worldPerPixel
      targetRef.current = { x: targetRef.current.x + moveX, y: targetRef.current.y + moveY }
      velocityRef.current = { x: moveX, y: moveY }
    }

    function onPointerUp() {
      endPan()
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const next = zoomRef.current * (1 - e.deltaY * ZOOM_STEP)
      zoomRef.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    }

    function visibleWidthAtTarget(): number {
      const distance = BASE_DISTANCE / zoomRef.current
      const vFov = (FOV_DEGREES * Math.PI) / 180
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance
      return visibleHeight * (el.clientWidth / el.clientHeight)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame(() => {
    // Apply inertia once the pointer is released: velocity decays exponentially.
    if (!isPanning()) {
      const v = velocityRef.current
      if (Math.abs(v.x) > 0.0001 || Math.abs(v.y) > 0.0001) {
        targetRef.current = { x: targetRef.current.x + v.x, y: targetRef.current.y + v.y }
        velocityRef.current = { x: v.x * 0.9, y: v.y * 0.9 }
      }
    }

    const state = useCameraStore.getState()
    const dampedZoom = THREE.MathUtils.lerp(state.zoom, zoomRef.current, PAN_DAMPING)
    const dampedTarget = {
      x: THREE.MathUtils.lerp(state.target.x, targetRef.current.x, PAN_DAMPING),
      y: THREE.MathUtils.lerp(state.target.y, targetRef.current.y, PAN_DAMPING),
    }
    if (dampedZoom !== state.zoom) useCameraStore.setState({ zoom: dampedZoom })
    if (dampedTarget.x !== state.target.x || dampedTarget.y !== state.target.y) {
      useCameraStore.setState({ target: dampedTarget })
    }

    const distance = BASE_DISTANCE / dampedZoom
    camera.position.set(dampedTarget.x, dampedTarget.y + Math.sin(TILT_RADIANS) * distance * 0.35, distance)
    camera.lookAt(dampedTarget.x, dampedTarget.y, 0)
  })

  return null
}

/** Begins a camera pan gesture; call from an R3F pointer handler that has already confirmed the click hit bare board. */
export function beginCameraPan(clientX: number, clientY: number) {
  beginPan(clientX, clientY)
}

/** The camera element itself; kept separate so `CameraRig`'s effect can assume `camera` already exists. */
export function CameraDefinition() {
  return (
    <PerspectiveCamera makeDefault fov={FOV_DEGREES} near={0.1} far={200} position={[0, 8, BASE_DISTANCE]} />
  )
}
