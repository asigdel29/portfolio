import * as THREE from 'three'

/**
 * The invisible plane evidence items are dragged across.
 *
 * Kept as a single shared plane (rather than one per item) since all items
 * live at the same nominal Z depth; item-specific Z offsets (stacking order)
 * are applied separately by the caller after projecting onto this plane.
 */
export const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

const raycaster = new THREE.Raycaster()
const intersection = new THREE.Vector3()

/**
 * Projects the camera's current pointer ray onto `dragPlane` and returns the
 * board-local XY coordinate of the intersection, or `null` if the ray is
 * parallel to the plane (should not happen with this scene's camera angles,
 * but callers must handle it defensively).
 */
export function projectPointerToBoard(
  camera: THREE.Camera,
  pointerNDC: THREE.Vector2,
): { x: number; y: number } | null {
  raycaster.setFromCamera(pointerNDC, camera)
  const hit = raycaster.ray.intersectPlane(dragPlane, intersection)
  if (!hit) return null
  return { x: intersection.x, y: intersection.y }
}
