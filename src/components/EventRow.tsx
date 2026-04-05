import { formatTimestamp, timeAgo, shortAddress } from "../lib/format"
import type { KaarnaEvent } from "../hooks/useKaarnaHistory"
import type { PieceId } from "../constants"

type Props = {
  event: KaarnaEvent
}

const KIND_LABELS: Record<PieceId, Record<string, string>> = {
  hiven: {
    sent: "sent a gesture to",
    received: "received a gesture from",
  },
  kaipuu: {
    marked: "marked longing into the chain",
  },
  vare: {
    gathered: "gathered around",
  },
  polku: {
    walked: "walked and carried",
  },
}

export function EventRow({ event }: Props) {
  const label = KIND_LABELS[event.piece]?.[event.kind] ?? event.kind
  const ts = event.timestamp

  return (
    <div className="event-row">
      <div className="event-row-left">
        <span className="event-date" title={formatTimestamp(ts)}>
          {timeAgo(ts)}
        </span>
      </div>
      <div className="event-row-right">
        <span className="event-label">{label}</span>
        {event.data?.to && (
          <span className="event-data">{shortAddress(event.data.to)}</span>
        )}
        {event.data?.from && (
          <span className="event-data">{shortAddress(event.data.from)}</span>
        )}
        {event.data?.title && (
          <span className="event-data">{event.data.title}</span>
        )}
        {event.data?.carried && (
          <span className="event-carried">"{event.data.carried}"</span>
        )}
      </div>
    </div>
  )
}
