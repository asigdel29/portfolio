import { EffectComposer, Vignette, Bloom, SMAA, N8AO, BrightnessContrast } from '@react-three/postprocessing'

/**
 * Post-processing stack for the cinematic look: soft bloom on hot highlights,
 * a vignette to draw focus toward the board center, screen-space AO for
 * contact shadows between stacked evidence items, and SMAA for edge
 * antialiasing (cheaper than MSAA at the resolution this scene renders).
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.6} intensity={1.8} distanceFalloff={1} />
      <Bloom intensity={0.4} luminanceThreshold={0.8} luminanceSmoothing={0.2} mipmapBlur />
      <BrightnessContrast brightness={-0.03} contrast={0.12} />
      <Vignette eskil={false} offset={0.18} darkness={0.75} />
      <SMAA />
    </EffectComposer>
  )
}
