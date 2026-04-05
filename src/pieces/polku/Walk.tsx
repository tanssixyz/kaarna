import { useState, useRef, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { decodeEventLog } from "viem"
import { POLKU_ADDRESS, ACTIVE_CHAIN, MAX_TURNS, MAX_CARRIED_LENGTH } from "../../constants"
import PolkuABI from "../../abi/Polku.json"

type Phase = "idle" | "walking" | "arrived" | "carrying" | "confirming" | "witnessed"

interface Message { role: "user" | "assistant"; content: string }
interface WalkResult { walkId: bigint; carried: string; txHash: `0x${string}` }

async function askPolku(messages: Message[]): Promise<string> {
  const res = await fetch("/api/walk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })
  if (res.status === 429) {
    const data = await res.json()
    throw new Error(data.error ?? "Too many walks. Try again in an hour.")
  }
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.text as string
}

export function Walk() {
  const { chain } = useAccount()
  const [phase, setPhase] = useState<Phase>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [userInput, setUserInput] = useState("")
  const [turnCount, setTurnCount] = useState(0)
  const [carried, setCarried] = useState("")
  const [result, setResult] = useState<WalkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { writeContract, isPending } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash, query: { enabled: !!txHash },
  })

  useEffect(() => {
    if (phase === "walking" && inputRef.current) inputRef.current.focus()
  }, [phase, currentQuestion])

  useEffect(() => {
    if (!receipt) return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: PolkuABI as Parameters<typeof decodeEventLog>[0]["abi"],
          data: log.data, topics: log.topics, eventName: "Walked",
        })
        const args = decoded.args as { id: bigint; walker: `0x${string}`; timestamp: bigint; carried: string }
        setResult({ walkId: args.id, carried: args.carried, txHash: txHash! })
        setPhase("witnessed")
        return
      } catch { /* not this event */ }
    }
  }, [receipt, txHash])

  const beginWalk = async () => {
    setLoading(true); setPhase("walking")
    try {
      const openingMessages: Message[] = [{ role: "user", content: "I am here." }]
      const response = await askPolku(openingMessages)
      const clean = response.replace(/ARRIVED/g, "").trim()
      setMessages(openingMessages); setCurrentQuestion(clean); setTurnCount(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("idle")
    } finally {
      setLoading(false)
    }
  }

  const sendResponse = async () => {
    if (!userInput.trim() || loading) return
    const userMessage: Message = { role: "user", content: userInput.trim() }
    const newMessages = [...messages, { role: "assistant" as const, content: currentQuestion }, userMessage]
    setMessages(newMessages); setUserInput(""); setLoading(true)
    const newTurnCount = turnCount + 1
    if (newTurnCount >= MAX_TURNS) { setLoading(false); setPhase("arrived"); return }
    try {
      const response = await askPolku(newMessages)
      const hasArrived = response.includes("ARRIVED")
      const clean = response.replace(/ARRIVED/g, "").trim()
      setCurrentQuestion(clean); setTurnCount(newTurnCount)
      if (hasArrived) setPhase("arrived")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("idle")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendResponse() }
  }

  const mintWalk = () => {
    if (!carried.trim()) return
    setPhase("confirming")
    writeContract(
      {
        address: POLKU_ADDRESS,
        abi: PolkuABI as Parameters<typeof writeContract>[0]["abi"],
        functionName: "walk", args: [carried.trim()],
        chainId: ACTIVE_CHAIN.id,
      },
      { onSuccess: (hash) => setTxHash(hash), onError: () => setPhase("arrived") }
    )
  }

  const reset = () => {
    setPhase("idle"); setMessages([]); setCurrentQuestion(""); setUserInput("")
    setTurnCount(0); setCarried(""); setResult(null); setTxHash(undefined); setError(null)
  }

  const wrongChain = chain?.id !== ACTIVE_CHAIN.id

  if (phase === "idle") return (
    <div className="p-card">
      {wrongChain ? (
        <p className="p-warning">switch to {ACTIVE_CHAIN.name}</p>
      ) : (
        <button className="p-btn" onClick={beginWalk} disabled={loading}>
          {loading ? "entering…" : "enter the forest"}
        </button>
      )}
      {error && <p className="p-sub" style={{ opacity: 0.6 }}>{error}</p>}
    </div>
  )

  if (phase === "walking") return (
    <div className="p-card">
      {loading && !currentQuestion ? (
        <p className="p-question">…</p>
      ) : (
        <>
          <p className="p-question">{currentQuestion}</p>
          <div className="p-turn-dots">
            {Array.from({ length: MAX_TURNS }).map((_, i) => (
              <span key={i} className={`p-turn-dot ${i < turnCount ? "p-turn-dot-filled" : ""}`} />
            ))}
          </div>
          <textarea
            ref={inputRef}
            className="p-response-input"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="respond…"
            rows={2}
            disabled={loading}
          />
          <button className="p-btn" onClick={sendResponse} disabled={loading || !userInput.trim()}>
            {loading ? "…" : "↵"}
          </button>
        </>
      )}
    </div>
  )

  if (phase === "arrived") return (
    <div className="p-card">
      <p className="p-question">what do you carry from this?</p>
      <p className="p-sub">one thing. a word, a line, a silence named. this is what gets witnessed.</p>
      <textarea
        className="p-response-input"
        value={carried}
        onChange={e => { if (e.target.value.length <= MAX_CARRIED_LENGTH) setCarried(e.target.value) }}
        placeholder="one thing, a word, a line…"
        rows={2}
        autoFocus
      />
      <p className="p-char-count">{carried.length} / {MAX_CARRIED_LENGTH}</p>
      <button className="p-btn" onClick={() => setPhase("carrying")} disabled={!carried.trim()}>
        witness this
      </button>
      <button className="p-ghost" onClick={reset}>leave without carrying</button>
    </div>
  )

  if (phase === "carrying") return (
    <div className="p-card">
      <p className="p-label">you carry</p>
      <p className="p-carried">"{carried}"</p>
      <p className="p-sub">this will be written to Base and cannot be changed.</p>
      <button className="p-btn" onClick={mintWalk} disabled={isPending || isConfirming}>
        {isPending ? "confirm in wallet…" : isConfirming ? "witnessing…" : "write to chain"}
      </button>
      <button className="p-ghost" onClick={() => setPhase("arrived")}>go back</button>
    </div>
  )

  if (phase === "confirming") return (
    <div className="p-card">
      <p className="p-question">{isPending ? "confirm in your wallet…" : "witnessing…"}</p>
    </div>
  )

  if (phase === "witnessed" && result) return (
    <div className="p-card">
      <p className="p-label">witnessed</p>
      <p className="p-carried">"{result.carried}"</p>
      <p className="p-meta">polku #{result.walkId.toString()}</p>
      <a className="p-tx-link"
        href={`${ACTIVE_CHAIN.blockExplorers?.default.url}/tx/${result.txHash}`}
        target="_blank" rel="noreferrer">view on basescan ↗</a>
      <button className="p-ghost" onClick={reset}>walk again</button>
    </div>
  )

  return null
}
