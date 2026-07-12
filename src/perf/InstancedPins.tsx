import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useBoardStore } from '../state/boardStore'
import { getItemPinWorldPosition } from '../scene/items/itemVisuals'

const SPIKE_GEOMETRY = new THREE.CylinderGeometry(0.02, 0.03, 0.14, 8)
const HEAD_GEOMETRY = new THREE.SphereGeometry(0.09, 16, 16)
const PIN_COLOR = new THREE.Color('#c62828')
/**
 * Fixed instance-buffer capacity, sized generously above realistic item
 * counts. `InstancedMesh.count` (how many instances actually draw) is
 * mutated freely each render; the buffer itself is only reallocated if this
 * cap is changed, so picking one big enough up front avoids any GPU buffer
 * churn as items are added/removed.
 */
const MAX_PINS = 2000

/**
 * Renders every evidence item's pushpin as two `InstancedMesh` draw calls
 * (spike + head) instead of one `<Pin>` component tree per item.
 *
 * Individual `<mesh>` pins were fine up to a few dozen items, but each pin
 * is 2 draw calls; at hundreds of items that's hundreds of draw calls doing
 * essentially nothing but restating the same tiny geometry. Instancing
 * collapses that to exactly 2 draw calls regardless of item count.
 *
 * Sticky notes are excluded — they're taped, not pinned (see `EvidenceCard`,
 * which skips rendering a pin for that kind).
 */
export function InstancedPins() {
  const items = useBoardStore((s) => s.items)
  const itemOrder = useBoardStore((s) => s.itemOrder)
  const spikeRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)

  const pinnedItemIds = useMemo(() => itemOrder.filter((id) => items[id]?.kind !== 'sticky-note'), [itemOrder, items])

  useLayoutEffect(() => {
    const spikeMesh = spikeRef.current
    const headMesh = headRef.current
    if (!spikeMesh || !headMesh) return

    const matrix = new THREE.Matrix4()
    pinnedItemIds.forEach((id, i) => {
      const item = items[id]
      if (!item) return
      const [x, y, z] = getItemPinWorldPosition(item)
      matrix.makeTranslation(x, y, z - 0.05)
      spikeMesh.setMatrixAt(i, matrix)
      matrix.makeTranslation(x, y, z)
      headMesh.setMatrixAt(i, matrix)
    })
    spikeMesh.instanceMatrix.needsUpdate = true
    headMesh.instanceMatrix.needsUpdate = true
    spikeMesh.count = pinnedItemIds.length
    headMesh.count = pinnedItemIds.length
  }, [pinnedItemIds, items])

  return (
    <>
      <instancedMesh ref={spikeRef} args={[SPIKE_GEOMETRY, undefined, MAX_PINS]} castShadow>
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[HEAD_GEOMETRY, undefined, MAX_PINS]} castShadow>
        <meshStandardMaterial color={PIN_COLOR} roughness={0.4} metalness={0.1} />
      </instancedMesh>
    </>
  )
}
