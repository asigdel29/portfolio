import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSelectionStore } from '../state/selectionStore'
import { beginCameraPan } from './CameraRig'

/** Half-extents of the cork board's playable surface, in board-local units. */
export const BOARD_WIDTH = 32
export const BOARD_HEIGHT = 20
const FRAME_THICKNESS = 0.6
const FRAME_DEPTH = 0.8
const CORK_DEPTH = 0.35
/** Front face of the wooden frame, in world Z; everything else is derived from this. */
const FRAME_FRONT_Z = 0
/**
 * Front face of the cork insert. Deliberately proud of the frame's front
 * face (rather than coplanar) — the frame box is a solid slab spanning the
 * full board footprint, not a hollow ring, so the cork insert sits fully in
 * front of it. Coplanar faces here previously caused z-fighting moiré.
 *
 * Exported so evidence items (which are pinned to the cork surface) can
 * anchor their base Z to this same value.
 */
export const CORK_FRONT_Z = 0.04

/**
 * The cork evidence board: a beveled wooden frame around a cork insert.
 *
 * The board is a static rigid body so that pushpins and dropped items can
 * physically rest against its front face. Materials use procedurally
 * generated roughness/normal variation (via a canvas-based noise texture)
 * rather than external asset files, keeping the scene self-contained.
 */
export function Board() {
  const corkTexture = useCorkTexture()
  const woodTexture = useWoodTexture()

  /**
   * Clicking bare cork (i.e. a pointer-down that no item intercepted, since
   * items call `stopPropagation`) clears the current selection and starts a
   * camera pan gesture.
   */
  function onCorkPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.nativeEvent.button !== 0) return
    if (!e.shiftKey) useSelectionStore.getState().clearSelection()
    beginCameraPan(e.nativeEvent.clientX, e.nativeEvent.clientY)
  }

  return (
    <group>
      {/* Wooden frame */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, FRAME_FRONT_Z - FRAME_DEPTH / 2]} receiveShadow castShadow>
          <boxGeometry args={[BOARD_WIDTH + FRAME_THICKNESS * 2, BOARD_HEIGHT + FRAME_THICKNESS * 2, FRAME_DEPTH]} />
          <meshStandardMaterial map={woodTexture} roughness={0.55} metalness={0.08} color="#8a6a4a" />
        </mesh>
      </RigidBody>

      {/* Cork insert — the interactive plane items are pinned to sits at CORK_FRONT_Z */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, CORK_FRONT_Z - CORK_DEPTH / 2]} receiveShadow onPointerDown={onCorkPointerDown}>
          <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, CORK_DEPTH]} />
          <meshStandardMaterial map={corkTexture} roughness={0.95} metalness={0} color="#b08a5f" />
        </mesh>
      </RigidBody>
    </group>
  )
}

/** Generates a small tileable cork-like noise texture on a canvas, cached for the session. */
function useCorkTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#c19a6b'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = Math.random() * 1.6 + 0.3
      const shade = Math.random() * 60 - 30
      ctx.fillStyle = `rgba(${90 + shade}, ${60 + shade * 0.7}, ${30 + shade * 0.4}, ${Math.random() * 0.5 + 0.2})`
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(BOARD_WIDTH / 8, BOARD_HEIGHT / 8)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

/** Generates a dark walnut wood-grain texture (streaked, elongated fibers) for the frame. */
function useWoodTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const width = 512
    const height = 128
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    const base = ctx.createLinearGradient(0, 0, 0, height)
    base.addColorStop(0, '#5a4028')
    base.addColorStop(0.5, '#4a3220')
    base.addColorStop(1, '#3a2416')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, width, height)

    // Long horizontal grain streaks, varying opacity/thickness for an organic look.
    for (let i = 0; i < 140; i++) {
      const y = Math.random() * height
      const streakHeight = Math.random() * 2 + 0.4
      const shade = Math.random() * 50 - 25
      ctx.strokeStyle = `rgba(${40 + shade}, ${26 + shade * 0.6}, ${14 + shade * 0.3}, ${Math.random() * 0.35 + 0.1})`
      ctx.lineWidth = streakHeight
      ctx.beginPath()
      let x = 0
      ctx.moveTo(x, y)
      while (x < width) {
        x += 20 + Math.random() * 40
        ctx.lineTo(x, y + (Math.random() - 0.5) * 6)
      }
      ctx.stroke()
    }

    // A few darker knots for realism.
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const r = Math.random() * 4 + 3
      const knot = ctx.createRadialGradient(x, y, 0, x, y, r)
      knot.addColorStop(0, 'rgba(20,12,6,0.6)')
      knot.addColorStop(1, 'rgba(20,12,6,0)')
      ctx.fillStyle = knot
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 1.6, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set((BOARD_WIDTH + FRAME_THICKNESS * 2) / 6, 2)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}
