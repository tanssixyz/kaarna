import { useNavigate, useParams } from "react-router-dom"
import { isAddress } from "viem"
import { VareView } from "./VareView"

export function VareDetailPage() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()

  if (!address || !isAddress(address)) {
    return (
      <div className="piece-shell">
        <div className="piece-header">
          <button className="piece-back" onClick={() => navigate("/vare")}>← väre</button>
          <span className="piece-wordmark">väre</span>
        </div>
        <div className="piece-body">
          <div className="p-card">
            <p className="p-label">not found</p>
            <p className="p-sub">that is not a valid väre address.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="piece-shell">
      <div className="piece-header">
        <button className="piece-back" onClick={() => navigate("/vare")}>← väre</button>
        <ShareButton address={address} />
      </div>
      <div className="piece-body">
        <VareView address={address as `0x${string}`} />
      </div>
      <div className="piece-footer">
        <span className="piece-disclaimer">experimental · transactions are permanent</span>
      </div>
    </div>
  )
}

function ShareButton({ address }: { address: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/vare/${address}`)
  }
  return (
    <button className="piece-share" onClick={handleCopy}>share ↗</button>
  )
}
