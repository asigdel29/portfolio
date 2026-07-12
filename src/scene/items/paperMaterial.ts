import * as THREE from 'three'

/**
 * Builds a `MeshStandardMaterial` with a subtle, per-item vertex bend
 * injected via `onBeforeCompile`.
 *
 * The bend is a fixed function of local X/Y (not animated) so paper items
 * read as slightly curled/imperfect rather than perfectly flat, without any
 * per-frame cost. `seed` should be derived from the item id so the same
 * item always bends the same way across re-renders.
 */
export function createPaperMaterial(color: string, seed: number): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBendSeed = { value: seed }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uBendSeed;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float bendX = sin(position.x * 0.9 + uBendSeed) * 0.028;
        float bendY = sin(position.y * 1.1 + uBendSeed * 1.7) * 0.022;
        transformed.z += bendX + bendY;`,
      )
  }
  return material
}
