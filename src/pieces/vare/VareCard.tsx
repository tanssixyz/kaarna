import { useNavigate } from "react-router-dom"
import { useReadContracts } from "wagmi"
import type { Abi } from "viem"
import { ACTIVE_CHAIN } from "../../constants"
import VareABI from "../../abi/Vare.json"
import { formatTimeRemaining } from "../../lib/colour"

export function VareCard({ address }: { address: `0x${string}` }) {
  const navigate = useNavigate()
  const abi = VareABI as Abi

  const { data } = useReadContracts({
    contracts: [
      { address, abi, functionName: "title",     chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "isOpen",    chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "closesAt",  chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "markCount", chainId: ACTIVE_CHAIN.id },
    ],
  })

  if (!data) return null

  const title     = data[0].result as string
  const isOpen    = data[1].result as boolean
  const closesAt  = data[2].result as bigint
  const markCount = data[3].result as bigint

  return (
    <div
      className="p-vare-card"
      onClick={() => navigate(`/vare/${address}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/vare/${address}`)}
    >
      <div className="p-vare-card-header">
        <span className="p-vare-title">{title}</span>
        <span className={`p-vare-status ${isOpen ? "p-vare-status-open" : "p-vare-status-closed"}`}>
          {isOpen ? "open" : "closed"}
        </span>
      </div>
      <div className="p-vare-card-meta">
        <span className="p-meta">{markCount?.toString() ?? "0"} {markCount === 1n ? "mark" : "marks"}</span>
        <span className="p-meta-sep">·</span>
        <span className="p-meta">{isOpen ? formatTimeRemaining(closesAt) : "closed"}</span>
      </div>
    </div>
  )
}
