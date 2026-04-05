import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { decodeEventLog } from "viem"
import { KAIPUU_ADDRESS, ACTIVE_CHAIN } from "../../constants"
import KaipuuABI from "../../abi/Kaipuu.json"
import { deriveColour, formatDate } from "../../lib/colour"

type Phase = "idle" | "confirming" | "confirmed"

interface MarkResult {
  markId: bigint
  timestamp: bigint
  marker: `0x${string}`
}

export function Mark() {
  const { address, isConnected, chain } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [phase, setPhase] = useState<Phase>("idle")
  const [result, setResult] = useState<MarkResult | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  useEffect(() => {
    if (!receipt || !address) return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: KaipuuABI as Parameters<typeof decodeEventLog>[0]["abi"],
          data: log.data, topics: log.topics, eventName: "Marked",
        })
        const args = decoded.args as { id: bigint; marker: `0x${string}`; timestamp: bigint }
        setResult({ markId: args.id, timestamp: args.timestamp, marker: address })
        setPhase("confirmed")
        return
      } catch { /* not this event */ }
    }
  }, [receipt, address])

  const handleMark = () => {
    if (!isConnected) { openConnectModal?.(); return }
    writeContract(
      {
        address: KAIPUU_ADDRESS,
        abi: KaipuuABI as Parameters<typeof writeContract>[0]["abi"],
        functionName: "mark",
        chainId: ACTIVE_CHAIN.id,
      },
      {
        onSuccess: (hash) => { setTxHash(hash); setPhase("confirming") },
        onError: () => setPhase("idle"),
      }
    )
  }

  const onReset = () => { setPhase("idle"); setResult(null); setTxHash(undefined) }

  if (phase === "confirmed" && result) {
    const colour = deriveColour(result.markId, result.timestamp, result.marker)
    return (
      <div className="p-card">
        <div style={{ width: "100%", height: "72px", background: colour.css, borderRadius: "8px" }} />
        <p className="p-label">marked</p>
        <p className="p-phrase">your kaipuu will not be lost</p>
        <p className="p-meta">{formatDate(result.timestamp)}</p>
        <p className="p-meta">kaipuu #{result.markId.toString()}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colour.css, flexShrink: 0 }} />
          <p className="p-meta" style={{ opacity: 1 }}>the colour of your kaipuu is {colour.hex}</p>
        </div>
        {txHash && (
          <a className="p-tx-link"
            href={`${ACTIVE_CHAIN.blockExplorers?.default.url}/tx/${txHash}`}
            target="_blank" rel="noreferrer">
            view on basescan ↗
          </a>
        )}
        <MintOption markId={result.markId} colour={colour} />
        <button className="p-ghost" onClick={onReset}>mark again</button>
      </div>
    )
  }

  const isWaiting = isPending || isConfirming

  return (
    <div className="p-card">
      <p className="p-label">kaipuu</p>
      <p className="p-desc">
        A longing that passes before you can name it.<br />
        Mark this moment and the chain keeps it.<br />
        Nothing is sent to anyone.
      </p>
      {!isConnected ? (
        <button className="p-btn" onClick={() => openConnectModal?.()}>connect wallet</button>
      ) : chain?.id !== ACTIVE_CHAIN.id ? (
        <p className="p-warning">switch to {ACTIVE_CHAIN.name}</p>
      ) : (
        <button className="p-btn" onClick={handleMark} disabled={isWaiting}>
          {isPending ? "confirm in wallet…" : isConfirming ? "marking…" : "mark this moment"}
        </button>
      )}
      <p className="p-etymology">from Finnish — <em>kaipuu</em>, a longing for something that cannot be named</p>
    </div>
  )
}

function MintOption({ markId, colour }: { markId: bigint; colour: ReturnType<typeof deriveColour> }) {
  const [mintPhase, setMintPhase] = useState<"idle" | "confirming" | "done">("idle")
  const { writeContract, isPending } = useWriteContract()
  const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: mintTxHash, query: { enabled: !!mintTxHash },
  })

  useEffect(() => { if (isSuccess) setMintPhase("done") }, [isSuccess])

  const handleMint = () => {
    setMintPhase("confirming")
    writeContract(
      {
        address: KAIPUU_ADDRESS,
        abi: KaipuuABI as Parameters<typeof writeContract>[0]["abi"],
        functionName: "mint", args: [markId],
        chainId: ACTIVE_CHAIN.id,
      },
      {
        onSuccess: (hash) => setMintTxHash(hash),
        onError: () => setMintPhase("idle"),
      }
    )
  }

  if (mintPhase === "done") return (
    <p className="p-meta">kaipuu #{markId.toString()} held in your wallet</p>
  )

  return (
    <div className="p-mint">
      <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: colour.css, flexShrink: 0 }} />
      <div className="p-mint-body">
        <p className="p-mint-label">keep this kaipuu</p>
        <p className="p-mint-desc">mint a soulbound token — the colour, permanently yours.</p>
        <button className="p-btn-secondary" onClick={handleMint} disabled={isPending || isConfirming}>
          {isPending ? "confirm in wallet…" : isConfirming ? "minting…" : "mint token"}
        </button>
      </div>
    </div>
  )
}
