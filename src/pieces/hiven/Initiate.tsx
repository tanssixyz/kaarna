import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { isAddress } from "viem"
import { HIVEN_ADDRESS } from "../../constants"
import HivenABI from "../../abi/Hiven.json"
import { resolveAddress } from "../../lib/utils"

type ResolveState = "idle" | "resolving" | "resolved" | "failed"

export function Initiate() {
  const [input, setInput] = useState("")
  const [resolved, setResolved] = useState<string | null>(null)
  const [resolveState, setResolveState] = useState<ResolveState>("idle")
  const { address } = useAccount()

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    const trimmed = input.trim()
    if (!trimmed) { setResolved(null); setResolveState("idle"); return }
    if (isAddress(trimmed)) { setResolved(trimmed); setResolveState("resolved"); return }
    if (trimmed.includes(".")) {
      setResolveState("resolving")
      const timer = setTimeout(async () => {
        const result = await resolveAddress(trimmed)
        if (result) { setResolved(result); setResolveState("resolved") }
        else { setResolved(null); setResolveState("failed") }
      }, 600)
      return () => clearTimeout(timer)
    }
    setResolved(null); setResolveState("idle")
  }, [input])

  const isSelf = resolved?.toLowerCase() === address?.toLowerCase()
  const valid = resolved !== null && isAddress(resolved) && !isSelf

  function handleInitiate() {
    if (!valid || !resolved) return
    writeContract({
      address: HIVEN_ADDRESS,
      abi: HivenABI,
      functionName: "initiate",
      args: [resolved],
    })
  }

  if (isSuccess) {
    return (
      <div className="p-card">
        <p className="p-label">sent</p>
        <p className="p-phrase">a hiven is waiting for them</p>
        <p className="p-hash">{hash}</p>
        <button className="p-ghost" onClick={() => { reset(); setInput(""); setResolved(null); setResolveState("idle") }}>
          send another
        </button>
      </div>
    )
  }

  return (
    <div className="p-card">
      <p className="p-label">send</p>
      <p className="p-sub">a silent gesture — sent, witnessed, waiting</p>

      <div className="p-field">
        <label className="p-field-label">address or ENS name</label>
        <input
          className="p-field-input"
          placeholder="0x… or name.eth"
          value={input}
          onChange={e => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {resolveState === "resolving" && <span className="p-field-hint">resolving…</span>}
        {resolveState === "resolved" && resolved && !isAddress(input.trim()) && (
          <span className="p-field-hint p-field-hint-ok">{resolved}</span>
        )}
        {resolveState === "failed" && <span className="p-field-error">name not found</span>}
        {isSelf && <span className="p-field-error">cannot send to yourself</span>}
      </div>

      <button
        className="p-btn"
        onClick={handleInitiate}
        disabled={!valid || isPending || isConfirming}
      >
        {isPending ? "confirm in wallet…" : isConfirming ? "placing mark…" : "send hiven"}
      </button>

      {error && (
        <p className="p-field-error">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}
