import { useBoardStore } from '../../state/boardStore'
import { EvidenceCard } from './EvidenceCard'

/** Renders every evidence item currently on the board, in insertion order (also the stacking/z order). */
export function ItemsLayer() {
  const itemOrder = useBoardStore((s) => s.itemOrder)
  const items = useBoardStore((s) => s.items)

  return (
    <>
      {itemOrder.map((id) => {
        const item = items[id]
        if (!item) return null
        return <EvidenceCard key={id} item={item} />
      })}
    </>
  )
}
