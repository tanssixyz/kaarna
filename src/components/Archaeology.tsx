import { useNavigate } from "react-router-dom"
import { useAccount } from "wagmi"
import { useKaarnaHistory } from "../hooks/useKaarnaHistory"
import { PieceStrata } from "./PieceStrata"
import { PieceMark } from "./PieceMark"
import { PIECES, type PieceId } from "../constants"

function ViiveMark() {
  return (
    <svg width={16} height={16} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="3" fill="#a855f7" opacity="0.4"/>
    </svg>
  )
}

export function Archaeology() {
  const { address } = useAccount()
  const { events, loading, error, total } = useKaarnaHistory(address)
  const navigate = useNavigate()

  const byPiece: Record<PieceId, typeof events> = {
    hiven: [], kaipuu: [], vare: [], polku: [],
  }
  for (const e of events) byPiece[e.piece].push(e)
  const activePieces = PIECES.filter((p) => byPiece[p.id].length > 0)

  return (
    <div className="arch">

      {/* ── Piece index — always navigable ───────────────────────────────── */}
      <div className="arch-pieces">
        <p className="arch-pieces-label">inside the milonga</p>
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
      </div>

      {/* ── History ───────────────────────────────────────────────────────── */}
      <div className="arch-record">
        <p className="arch-record-label">your record</p>

        {loading && <p className="arch-loading">reading the chain</p>}

        {!loading && error && (
          <p className="arch-error">something didn't resolve — {error}</p>
        )}

        {!loading && !error && total === 0 && (
          <p className="arch-empty">no marks yet — visit any piece above and leave one</p>
        )}

        {!loading && !error && total > 0 && (
          <>
            <div className="arch-summary">
              <span className="arch-total">{total}</span>
              <span className="arch-total-label">
                {total === 1 ? "mark in the record" : "marks in the record"}
              </span>
            </div>
            <div className="arch-strata">
              {activePieces.map((piece) => (
                <PieceStrata
                  key={piece.id}
                  pieceId={piece.id}
                  events={byPiece[piece.id]}
                  onNavigate={() => navigate(piece.path)}
                />
              ))}
            </div>
            <div className="arch-viive">
              <span className="arch-viive-name">viive</span>
              <span className="arch-viive-hint">
                the reading arrives when the accumulation is ready
              </span>
            </div>
          </>
        )}
      </div>

      <footer className="floor-footer">
        <a href="https://blockdancer.kaarna.xyz" target="_blank" rel="noreferrer" className="floor-maker">
          blockdancer.base.eth
        </a>
        <span className="floor-note">experimental · Base mainnet</span>
      </footer>
    </div>
  )
}
