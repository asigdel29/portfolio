import { useBoardStore } from '../state/boardStore'
import { Rope } from './Rope'

/** Renders every rope connection currently on the board. */
export function RopesLayer() {
  const ropeOrder = useBoardStore((s) => s.ropeOrder)
  return (
    <>
      {ropeOrder.map((id) => (
        <Rope key={id} ropeId={id} />
      ))}
    </>
  )
}
