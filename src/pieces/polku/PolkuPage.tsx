import { useNavigate } from "react-router-dom"
import { useAccount } from "wagmi"
import { Walk } from "./Walk"
import { About } from "../../components/About"

export function PolkuPage() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()

  return (
    <div className="piece-shell">
      <div className="piece-header">
        <button className="piece-back" onClick={() => navigate("/")}>← kaarna</button>
        <span className="piece-wordmark">polku</span>
      </div>

      <div className="piece-body">
        {!isConnected ? (
          <div className="p-card">
            <p className="p-desc">
              A walk through unmapped territory.<br />
              Something asks. You arrive.<br />
              You carry one thing out.
            </p>
          </div>
        ) : (
          <Walk />
        )}

        <About name="polku">
          <p>You enter an unmapped forest. Something asks you a question.</p>
          <p>
            Not to test you. Not to guide you.
            To find where you actually are —
            beneath the habit of answering.
          </p>
          <p>
            When you arrive somewhere real, the walk ends.
            You carry one thing out.
            That one thing is written to Base and witnessed permanently.
          </p>
          <p>The exchange disappears. What you carried does not.</p>
          <p className="p-about-etymology">
            from Finnish — <em>polku</em>, a path made by walking, not planned in advance
          </p>
        </About>
      </div>

      <div className="piece-footer">
        <a
          href="https://basescan.org/address/0x039352Ec373fbdCEEd96ab864004eF316F53EdD0"
          target="_blank" rel="noreferrer"
          className="piece-contract"
        >contract ↗</a>
        <span className="piece-disclaimer">experimental · transactions are permanent</span>
      </div>
    </div>
  )
}
