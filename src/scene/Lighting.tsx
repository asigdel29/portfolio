import { Environment } from '@react-three/drei'

/**
 * Cinematic "detective's desk lamp" lighting rig.
 *
 * A warm, slightly off-center key light stands in for a desk lamp, with a
 * cool, low-intensity ambient/fill so shadow sides never go fully black.
 * A neutral HDRI provides subtle environment reflections on glossy items
 * (photo glaze, glass-look document sleeves) without needing a bundled
 * asset — drei's `Environment` generates one procedurally via `preset`.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.09} color="#3a4a62" />

      {/* Key light: warm desk lamp, angled from upper-left */}
      <spotLight
        position={[-10, 14, 16]}
        angle={0.48}
        penumbra={0.55}
        intensity={260}
        color="#ffb374"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-near={5}
        shadow-camera-far={50}
      />

      {/* Secondary warm rim light from the opposite corner, low intensity, for depth on item edges */}
      <spotLight position={[16, -10, 20]} angle={0.6} penumbra={0.8} intensity={50} color="#ff9d5c" />

      {/* Soft cool fill so shadow sides never go fully black, kept subtle for contrast */}
      <pointLight position={[14, -6, 10]} intensity={18} color="#5c7a9c" distance={40} decay={2} />

      <Environment preset="apartment" environmentIntensity={0.12} />
    </>
  )
}
