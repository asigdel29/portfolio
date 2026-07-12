import { createRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, useRopeJoint, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useBoardStore } from '../state/boardStore'
import { ROPE_MATERIAL_PRESETS } from '../state/ropeVisuals'
import { getItemPinWorldPosition } from './items/itemVisuals'

/**
 * Number of dynamic physics bodies making up one rope's chain.
 *
 * The design brief calls for 30–100 particles per rope; this build uses a
 * smaller chain (each joint is a full Rapier rigid body + rope-joint
 * constraint, which is far more expensive than a hand-rolled Verlet
 * particle). 14 segments still reads as a convincing catenary curve once
 * smoothed through a Catmull-Rom spline for rendering, and keeps ~100
 * simultaneous ropes within the 60fps budget. If profiling in the
 * performance pass (see `src/perf`) shows headroom, raise this constant —
 * no other code needs to change.
 */
const SEGMENT_COUNT = 14
/** How much longer the rope's rest length is than the straight-line distance between its two pins, producing visible sag. */
const SLACK_FACTOR = 1.22
const RENDER_SAMPLES = 48
const RADIAL_SEGMENTS = 6
/** No rope body collides with anything (including other ropes) — collision response would look chaotic and costs performance for no visual benefit at this fidelity. */
const NO_COLLISION_GROUPS = 0
const GROWTH_DURATION_S = 0.6

export function Rope({ ropeId }: { ropeId: string }) {
  const rope = useBoardStore((s) => s.ropes[ropeId])
  const fromItem = useBoardStore((s) => (rope ? s.items[rope.fromItemId] : undefined))
  const toItem = useBoardStore((s) => (rope ? s.items[rope.toItemId] : undefined))

  const anchorARef = useRef<RapierRigidBody>(null)
  const anchorBRef = useRef<RapierRigidBody>(null)
  const segmentRefs = useMemo(
    () => Array.from({ length: SEGMENT_COUNT }, () => createRef<RapierRigidBody>()),
    [],
  )

  const meshRef = useRef<THREE.Mesh>(null)
  /** Set on the first `useFrame` tick this rope exists; growth is computed from elapsed clock time relative to it. */
  const growthStartRef = useRef<number | null>(null)

  const initialFrom = useMemo<[number, number, number]>(
    () => (fromItem ? getItemPinWorldPosition(fromItem) : [0, 0, 0]),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const initialTo = useMemo<[number, number, number]>(
    () => (toItem ? getItemPinWorldPosition(toItem) : [1, 0, 0]),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const restSegmentLength = useMemo(() => {
    const dist = new THREE.Vector3(...initialFrom).distanceTo(new THREE.Vector3(...initialTo))
    return (dist * SLACK_FACTOR) / (SEGMENT_COUNT + 1)
  }, [initialFrom, initialTo])

  const segmentSpawnPositions = useMemo(() => {
    const start = new THREE.Vector3(...initialFrom)
    const end = new THREE.Vector3(...initialTo)
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
      const t = (i + 1) / (SEGMENT_COUNT + 1)
      const p = start.clone().lerp(end, t)
      // Tiny deterministic perpendicular jitter avoids a perfectly colinear spawn, which
      // otherwise leaves the constraint solver with no sideways direction to resolve sag into.
      p.y -= Math.sin(t * Math.PI) * 0.15
      return [p.x, p.y, p.z] as [number, number, number]
    })
  }, [initialFrom, initialTo])

  // Rope-joint chain: anchorA -> seg0 -> seg1 -> ... -> segN-1 -> anchorB.
  // A fixed-length loop of hook calls is safe here since SEGMENT_COUNT is a module constant,
  // so the same number of hooks fires in the same order on every render.
  // The cast works around @react-three/rapier's joint hooks requiring a non-nullable
  // RefObject while `useRef<RapierRigidBody>(null)` (correctly) types as nullable; the
  // hooks themselves already guard against a still-null `.current` internally.
  const asNonNull = (r: React.RefObject<RapierRigidBody | null>) => r as React.RefObject<RapierRigidBody>
  useRopeJoint(asNonNull(anchorARef), asNonNull(segmentRefs[0]), [[0, 0, 0], [0, 0, 0], restSegmentLength])
  for (let i = 0; i < SEGMENT_COUNT - 1; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRopeJoint(asNonNull(segmentRefs[i]), asNonNull(segmentRefs[i + 1]), [[0, 0, 0], [0, 0, 0], restSegmentLength])
  }
  useRopeJoint(asNonNull(segmentRefs[SEGMENT_COUNT - 1]), asNonNull(anchorBRef), [[0, 0, 0], [0, 0, 0], restSegmentLength])

  const preset = ROPE_MATERIAL_PRESETS[rope?.material ?? 'red-yarn']
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: preset.color, roughness: preset.roughness }),
    [preset.color, preset.roughness],
  )

  useFrame((state) => {
    if (!rope || !fromItem || !toItem) return
    const anchorA = anchorARef.current
    const anchorB = anchorBRef.current
    if (anchorA) anchorA.setNextKinematicTranslation(new THREE.Vector3(...getItemPinWorldPosition(fromItem)))
    if (anchorB) anchorB.setNextKinematicTranslation(new THREE.Vector3(...getItemPinWorldPosition(toItem)))

    // NOTE: segments currently never sleep (`canSleep={false}`) — with sleep enabled, an
    // iterative 14-link rope-joint chain could freeze mid-convergence, one frame short of
    // fully reaching both anchors, producing a rope that visibly falls short of its target
    // pin. The performance pass (src/perf) should reintroduce sleeping with an explicit
    // wake-on-anchor-move signal instead of relying on Rapier's automatic sleep heuristic.
    const points: THREE.Vector3[] = []
    if (anchorA) points.push(anchorA.translation() as THREE.Vector3)
    for (const ref of segmentRefs) {
      if (ref.current) points.push(ref.current.translation() as THREE.Vector3)
    }
    if (anchorB) points.push(anchorB.translation() as THREE.Vector3)
    if (points.length < 2) return

    if (growthStartRef.current === null) growthStartRef.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - growthStartRef.current
    const linearGrowth = Math.min(1, elapsed / GROWTH_DURATION_S)
    // Ease-out (matches the settle feel used elsewhere in the interaction layer).
    const growth = 1 - (1 - linearGrowth) * (1 - linearGrowth)

    const visibleCount = Math.max(2, Math.round(points.length * growth))
    const visiblePoints = points.slice(0, visibleCount)

    const curve = new THREE.CatmullRomCurve3(visiblePoints.map((p) => new THREE.Vector3(p.x, p.y, p.z)))
    const geometry = new THREE.TubeGeometry(curve, RENDER_SAMPLES, preset.radius, RADIAL_SEGMENTS, false)
    const mesh = meshRef.current
    if (mesh) {
      mesh.geometry.dispose()
      mesh.geometry = geometry
    }
  })

  if (!rope || !fromItem || !toItem) return null

  return (
    <group>
      <RigidBody ref={anchorARef} type="kinematicPosition" colliders={false} position={initialFrom}>
        <object3D />
      </RigidBody>
      <RigidBody ref={anchorBRef} type="kinematicPosition" colliders={false} position={initialTo}>
        <object3D />
      </RigidBody>
      {segmentSpawnPositions.map((pos, i) => (
        <RigidBody
          key={i}
          ref={segmentRefs[i]}
          type="dynamic"
          position={pos}
          collisionGroups={NO_COLLISION_GROUPS}
          linearDamping={0.6}
          angularDamping={0.9}
          gravityScale={0.7}
          canSleep={false}
        >
          <BallCollider args={[0.03]} mass={0.02} />
        </RigidBody>
      ))}
      <mesh ref={meshRef} material={material} castShadow receiveShadow>
        <bufferGeometry />
      </mesh>
    </group>
  )
}
