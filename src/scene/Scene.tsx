import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Board } from './Board'
import { Lighting } from './Lighting'
import { CameraDefinition, CameraRig } from './CameraRig'
import { PostFX } from './PostFX'
import { ItemsLayer } from './items/ItemsLayer'
import { RopesLayer } from './RopesLayer'
import { DragController } from '../interactions/DragController'

/**
 * Root 3D scene: canvas, physics world, camera rig, board, items, and lighting.
 *
 * Physics gravity only affects the rope simulation (added in a later step) —
 * evidence items are pinned paper, not falling bodies, and are positioned
 * directly from board state (see `EvidenceCard`). A near-zero gravity vector
 * is kept here so pin/rope rigid bodies added later behave sensibly without
 * every consumer needing to configure `Physics` itself.
 */
export function Scene() {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <CameraDefinition />
      <CameraRig />
      <DragController />
      <Lighting />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Board />
          <ItemsLayer />
          <RopesLayer />
        </Physics>
      </Suspense>
      <PostFX />
    </Canvas>
  )
}
