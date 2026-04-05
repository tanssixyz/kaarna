import { useNavigate } from "react-router-dom"
import { useReadContract } from "wagmi"
import type { Abi } from "viem"
import { ACTIVE_CHAIN, VARE_FACTORY_ADDRESS, BLOCKED_VARES } from "../../constants"
import VareFactoryABI from "../../abi/VareFactory.json"
import { VareCard } from "./VareCard"
import { CreateVare } from "./CreateVare"
import { About } from "../../components/About"

export function VarePage() {
  const navigate = useNavigate()
  const abi = VareFactoryABI as Abi

  const { data: allVares, isLoading, refetch } = useReadContract({
    address: VARE_FACTORY_ADDRESS,
    abi,
    functionName: "getAllVares",
    chainId: ACTIVE_CHAIN.id,
  })

  const vares = ((allVares as `0x${string}`[]) ?? [])
    .filter(a => !BLOCKED_VARES.includes(a))
    .slice()
    .reverse()

  return (
    <div className="piece-shell">
      <div className="piece-header">
        <button className="piece-back" onClick={() => navigate("/")}>← kaarna</button>
        <span className="piece-wordmark">väre</span>
      </div>

      <div className="piece-body">
        <div className="p-vare-index-header">
          <p className="p-label">all gatherings</p>
          <CreateVare onDeployed={refetch} />
        </div>

        {isLoading && <p className="p-sub">loading…</p>}

        {!isLoading && vares.length === 0 && (
          <div className="p-card">
            <p className="p-label">no gatherings yet</p>
            <p className="p-sub">deploy the first one above.</p>
          </div>
        )}

        {vares.map((address) => (
          <VareCard key={address} address={address} />
        ))}

        <About name="väre">
          <p>
            A väre is a gathering around something that exists in the world —
            a piece of music, a text, a moment in time.
          </p>
          <p>
            People who were moved by it can mark their resonance here.
            No message. No recipient. Nothing shared but the fact of being moved.
          </p>
          <p>
            Each mark receives a unique colour derived from that specific moment
            on the chain. The gathering closes when the window passes.
            What remains is permanent — who was here, and when.
          </p>
          <p className="p-about-etymology">
            from Finnish — <em>väre</em>, a shimmer, a ripple, the signal before contact
          </p>
        </About>
      </div>

      <div className="piece-footer">
        <a
          href="https://basescan.org/address/0x6066ab4358aC641ffdEE76f8d585eD67028467eD"
          target="_blank" rel="noreferrer"
          className="piece-contract"
        >factory ↗</a>
        <span className="piece-disclaimer">experimental · transactions are permanent</span>
      </div>
    </div>
  )
}
