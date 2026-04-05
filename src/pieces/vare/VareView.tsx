import { useState, useEffect } from "react"
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { decodeEventLog } from "viem"
import type { Abi } from "viem"
import { ACTIVE_CHAIN } from "../../constants"
import VareABI from "../../abi/Vare.json"
import { deriveColour, formatDate, formatTimeRemaining } from "../../lib/colour"

interface VareData {
  title: string
  url: string
  creator: `0x${string}`
  isOpen: boolean
  closesAt: bigint
  markCount: bigint
  isClosed: boolean
}

interface MarkData {
  id: bigint
  marker: `0x${string}`
  timestamp: bigint
}

export function VareView({ address }: { address: `0x${string}` }) {
  const abi = VareABI as Abi

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { address, abi, functionName: "title",     chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "url",       chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "creator",   chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "isOpen",    chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "closesAt",  chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "markCount", chainId: ACTIVE_CHAIN.id },
      { address, abi, functionName: "isClosed",  chainId: ACTIVE_CHAIN.id },
    ],
  })

  if (isLoading || !data) return <div className="p-card"><p className="p-sub">loading…</p></div>

  const vare: VareData = {
    title:     data[0].result as string,
    url:       data[1].result as string,
    creator:   data[2].result as `0x${string}`,
    isOpen:    data[3].result as boolean,
    closesAt:  data[4].result as bigint,
    markCount: data[5].result as bigint,
    isClosed:  data[6].result as boolean,
  }

  return (
    <div className="p-vare">
      <div className="p-vare-header">
        <p className="p-label">väre around</p>
        {vare.url ? (
          <a href={vare.url} target="_blank" rel="noreferrer" className="p-vare-title-link">
            {vare.title} ↗
          </a>
        ) : (
          <p className="p-vare-title-text">{vare.title}</p>
        )}
        <div className="p-vare-meta">
          <span className={`p-vare-status ${vare.isOpen ? "p-vare-status-open" : "p-vare-status-closed"}`}>
            {vare.isOpen ? "open" : "closed"}
          </span>
          <span className="p-meta-sep">·</span>
          <span className="p-meta">
            {vare.isOpen ? formatTimeRemaining(vare.closesAt) : `closed ${formatDate(vare.closesAt)}`}
          </span>
          <span className="p-meta-sep">·</span>
          <span className="p-meta">{vare.markCount.toString()} {vare.markCount === 1n ? "mark" : "marks"}</span>
        </div>
      </div>

      <MarkSection address={address} vare={vare} onMarked={refetch} />
      <MarkList address={address} markCount={vare.markCount} />
    </div>
  )
}

function MarkSection({ address, vare, onMarked }: { address: `0x${string}`; vare: VareData; onMarked: () => void }) {
  const { isConnected, chain } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [newMark, setNewMark] = useState<MarkData | null>(null)
  const { writeContract, isPending } = useWriteContract()
  const abi = VareABI as Abi

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash, query: { enabled: !!txHash },
  })

  useEffect(() => {
    if (!receipt) return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: VareABI as Parameters<typeof decodeEventLog>[0]["abi"],
          data: log.data, topics: log.topics, eventName: "Marked",
        })
        const args = decoded.args as { id: bigint; marker: `0x${string}`; timestamp: bigint }
        setNewMark({ id: args.id, marker: args.marker, timestamp: args.timestamp })
        onMarked()
        return
      } catch { /* not this event */ }
    }
  }, [receipt, onMarked])

  const handleMark = () => {
    if (!isConnected) { openConnectModal?.(); return }
    writeContract(
      { address, abi, functionName: "mark", chainId: ACTIVE_CHAIN.id },
      { onSuccess: (hash) => setTxHash(hash), onError: () => {} }
    )
  }

  if (newMark) {
    const colour = deriveColour(newMark.id, newMark.timestamp, newMark.marker)
    return (
      <div className="p-card">
        <div style={{ width: "100%", height: "64px", background: colour.css, borderRadius: "8px" }} />
        <p className="p-label">marked</p>
        <p className="p-phrase">your väre will not be forgotten</p>
        <p className="p-meta">{formatDate(newMark.timestamp)} · mark #{newMark.id.toString()}</p>
        {txHash && (
          <a className="p-tx-link"
            href={`${ACTIVE_CHAIN.blockExplorers?.default.url}/tx/${txHash}`}
            target="_blank" rel="noreferrer">view on basescan ↗</a>
        )}
        <button className="p-ghost" onClick={() => { setNewMark(null); setTxHash(undefined) }}>
          back to gathering
        </button>
      </div>
    )
  }

  if (!vare.isOpen) {
    return (
      <div className="p-card">
        <p className="p-label">this gathering is closed</p>
        <p className="p-desc">
          the window has passed. {vare.markCount.toString()} people marked their resonance.
        </p>
      </div>
    )
  }

  const isWaiting = isPending || isConfirming

  return (
    <div className="p-card">
      <p className="p-label">mark your resonance</p>
      <p className="p-desc">this thing moved you. mark it and the chain keeps it. nothing is sent to anyone.</p>
      {!isConnected ? (
        <button className="p-btn" onClick={() => openConnectModal?.()}>connect wallet</button>
      ) : chain?.id !== ACTIVE_CHAIN.id ? (
        <p className="p-warning">switch to {ACTIVE_CHAIN.name}</p>
      ) : (
        <button className="p-btn" onClick={handleMark} disabled={isWaiting}>
          {isPending ? "confirm in wallet…" : isConfirming ? "marking…" : "mark this"}
        </button>
      )}
    </div>
  )
}

function MarkList({ address, markCount }: { address: `0x${string}`; markCount: bigint }) {
  const count = Number(markCount)
  const abi = VareABI as Abi

  const contracts = Array.from({ length: count }, (_, i) => ({
    address, abi,
    functionName: "marks" as const,
    args: [BigInt(i)],
    chainId: ACTIVE_CHAIN.id,
  }))

  const { data } = useReadContracts({ contracts, query: { enabled: count > 0 } })

  if (count === 0) return null

  return (
    <div className="p-mark-list">
      <p className="p-label">the gathering</p>
      <div className="p-marks">
        {data?.map((result, i) => {
          if (!result.result) return null
          const [marker, timestamp] = result.result as [`0x${string}`, bigint]
          const colour = deriveColour(BigInt(i), timestamp, marker)
          return (
            <div key={i} className="p-mark-row">
              <div className="p-mark-dot" style={{ background: colour.css }} title={colour.hex} />
              <span className="p-meta">{formatDate(timestamp)}</span>
              <span className="p-meta" style={{ opacity: 0.35 }}>{colour.hex}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
