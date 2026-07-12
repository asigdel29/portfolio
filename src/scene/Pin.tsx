/**
 * A single pushpin: a small sphere head over a short cylindrical spike,
 * anchoring an evidence item or a rope endpoint to the cork board.
 *
 * Rendered as individual meshes for now; the performance pass (see
 * `src/perf`) swaps this for `InstancedMesh` once pin counts grow large
 * enough for draw calls to matter, without changing this component's props.
 */
export function Pin({ position, color = '#c62828' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.14, 8]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  )
}
