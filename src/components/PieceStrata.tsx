import { PIECES, type PieceId } from "../constants"
import { EventRow } from "./EventRow"
import type { KaarnaEvent } from "../hooks/useKaarnaHistory"

type Props = {
  pieceId: PieceId
  events: KaarnaEvent[]
  onNavigate: () => void
}

export function PieceStrata({ pieceId, events, onNavigate }: Props) {
  const meta = PIECES.find((p) => p.id === pieceId)
  if (!meta) return null

  return (
    <div className="strata">
      <div className="strata-header">
        <button className="strata-name" onClick={onNavigate}>
          {meta.name} →
        </button>
        <span className="strata-count">
          {events.length} {events.length === 1 ? "mark" : "marks"}
        </span>
      </div>
      <p className="strata-desc">{meta.description}</p>
      <div className="strata-events">
        {events.map((e, i) => (
          <EventRow key={`${e.txHash}-${i}`} event={e} />
        ))}
      </div>
    </div>
  )
}
