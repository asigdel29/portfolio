import type * as THREE from 'three'

/**
 * The scene's single active camera and canvas element, published by
 * `CameraRig` (which lives inside the R3F `<Canvas>` and therefore has
 * direct access to both via `useThree`).
 *
 * UI code outside the canvas (e.g. the lasso-selection overlay, a plain DOM
 * component) needs a `THREE.Camera` to project world points to screen space
 * and the canvas's bounding rect to map screen space to page space. Neither
 * is reactive state — the camera object identity is stable for the session
 * — so a plain module-level reference avoids threading a prop or context
 * through the DOM/canvas boundary.
 */
let activeCamera: THREE.Camera | null = null
let activeDomElement: HTMLCanvasElement | null = null

export function setActiveRenderContext(camera: THREE.Camera, domElement: HTMLCanvasElement) {
  activeCamera = camera
  activeDomElement = domElement
}

export function getActiveCamera(): THREE.Camera | null {
  return activeCamera
}

export function getActiveDomElement(): HTMLCanvasElement | null {
  return activeDomElement
}
