import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { projectPointerToBoard } from '../engine/picking/boardPlane'
import { isDragging, updateItemDrag, endItemDrag } from './dragState'

/**
 * Drives the active item-drag gesture, if any, once per frame.
 *
 * Mounted exactly once near the scene root. Doing the pointer-to-board
 * raycast here (rather than in each `EvidenceCard`) keeps the per-frame cost
 * at one raycast total regardless of how many items exist, since only a
 * single drag can be active at a time.
 */
export function DragController() {
  const { camera, pointer } = useThree()

  useEffect(() => {
    function onPointerUp() {
      endItemDrag()
    }
    window.addEventListener('pointerup', onPointerUp)
    return () => window.removeEventListener('pointerup', onPointerUp)
  }, [])

  useFrame(() => {
    if (!isDragging()) return
    const boardPoint = projectPointerToBoard(camera, pointer)
    if (boardPoint) updateItemDrag(boardPoint)
  })

  return null
}
