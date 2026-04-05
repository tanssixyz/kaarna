import { useNavigate } from "react-router-dom"
import { PIECES } from "../constants"
import { PieceMark } from "./PieceMark"

export function Floor() {
  const navigate = useNavigate()

  return (
    <div className="floor">
      <div className="floor-intro">
        <p className="floor-strapline">
          a collection of small on-chain gestures<br />
          at the edge of presence and encounter
        </p>
        <p className="floor-invitation">
          connect a wallet to read your archaeology
        </p>
      </div>

      <div className="piece-index">
        {PIECES.map((piece) => (
          <button
            key={piece.id}
            className="piece-entry"
            onClick={() => navigate(piece.path)}
          >
            <span className="piece-entry-name">
              <PieceMark id={piece.id} size={16} />
              {piece.name}
            </span>
            <span className="piece-entry-desc">{piece.description}</span>
            <span className="piece-entry-arrow">→</span>
          </button>
        ))}
        <div className="piece-entry piece-entry--dormant" aria-hidden="true">
          <span className="piece-entry-name">
            <ViiveMark />
            viive
          </span>
          <span className="piece-entry-desc">
            the delay in which meaning accumulates before it becomes visible
          </span>
          <span className="piece-entry-tag">not yet</span>
        </div>
      </div>

      <footer className="floor-footer">
        <a
          href="https://blockdancer.kaarna.xyz"
          target="_blank"
          rel="noreferrer"
          className="floor-maker"
        >
          blockdancer.base.eth
        </a>
        <span className="floor-note">experimental · Base mainnet</span>
      </footer>
    </div>
  )
}

function ViiveMark() {
  return (
    <svg width={16} height={16} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="3" fill="#a855f7" opacity="0.4"/>
    </svg>
  )
}
