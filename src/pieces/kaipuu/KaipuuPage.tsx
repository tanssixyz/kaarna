import { useNavigate } from "react-router-dom"
import { Mark } from "./Mark"
import { About } from "../../components/About"

export function KaipuuPage() {
  const navigate = useNavigate()

  return (
    <div className="piece-shell">
      <div className="piece-header">
        <button className="piece-back" onClick={() => navigate("/")}>← kaarna</button>
        <span className="piece-wordmark">kaipuu</span>
      </div>

      <div className="piece-body">
        <Mark />

        <About name="kaipuu">
          <p>A kaipuu is a moment of longing marked on the chain.</p>
          <p>No message. No recipient. Nothing sent to anyone.</p>
          <p>
            You felt something. You marked it.
            The chain witnessed it and keeps it.
            The feeling would have passed.
            Now it won't be lost.
          </p>
          <p>
            Each kaipuu receives a unique colour —
            derived from the moment itself,
            permanent and unrepeatable.
          </p>
          <p className="p-about-etymology">
            from Finnish — <em>kaipuu</em>, a longing for something that cannot be named or recovered
          </p>
        </About>
      </div>

      <div className="piece-footer">
        <a
          href="https://basescan.org/address/0x77b7277A6f737A5166193511388e096f0Bd41093"
          target="_blank" rel="noreferrer"
          className="piece-contract"
        >contract ↗</a>
        <span className="piece-disclaimer">experimental · transactions are permanent</span>
      </div>
    </div>
  )
}
