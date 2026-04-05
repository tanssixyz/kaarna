import { useState } from "react"
import { useAccount } from "wagmi"
import { useNavigate } from "react-router-dom"
import { Initiate } from "./Initiate"
import { Received } from "./Received"
import { NetworkGuard } from "./NetworkGuard"
import { About } from "../../components/About"

type Tab = "send" | "received"

export function HivenPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("send")

  return (
    <div className="piece-shell">
      <div className="piece-header">
        <button className="piece-back" onClick={() => navigate("/")}>← kaarna</button>
        <span className="piece-wordmark">hiven</span>
      </div>

      <div className="piece-body">
        {!isConnected ? (
          <div className="p-card">
            <p className="p-desc">
              The smallest possible on-chain gesture.<br />
              No message. No value. No notification.<br />
              Just the fact that you thought of someone.
            </p>
          </div>
        ) : (
          <NetworkGuard>
            <nav className="piece-tabs">
              <button
                className={`piece-tab ${tab === "send" ? "piece-tab-active" : ""}`}
                onClick={() => setTab("send")}
              >send</button>
              <button
                className={`piece-tab ${tab === "received" ? "piece-tab-active" : ""}`}
                onClick={() => setTab("received")}
              >received</button>
            </nav>
            {tab === "send" && <Initiate />}
            {tab === "received" && <Received />}
          </NetworkGuard>
        )}

        <About name="hiven">
          <p>A hiven is a small on-chain gesture directed at someone's wallet address.</p>
          <p>No message. No value. No notification.</p>
          <p>
            The sender knows they sent it.
            The chain recorded it.
            The receiver may never find it.
            That's enough.
          </p>
          <p>You send it because you thought of someone.</p>
          <p className="p-about-etymology">
            from Finnish — <em>hiven</em>, a trace, the smallest possible amount of something
          </p>
        </About>
      </div>

      <div className="piece-footer">
        <a
          href="https://basescan.org/address/0x74f00FE7f08B2623dC6f67EEd05dA9A090a9E139"
          target="_blank" rel="noreferrer"
          className="piece-contract"
        >contract ↗</a>
        <span className="piece-disclaimer">experimental · transactions are permanent</span>
      </div>
    </div>
  )
}
