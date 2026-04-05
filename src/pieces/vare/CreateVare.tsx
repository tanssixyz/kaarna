import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import type { Abi } from "viem"
import { ACTIVE_CHAIN, VARE_FACTORY_ADDRESS, SEVEN_DAYS, FOURTEEN_DAYS, TWENTYEIGHT_DAYS } from "../../constants"
import VareFactoryABI from "../../abi/VareFactory.json"

export function CreateVare({ onDeployed }: { onDeployed: () => void }) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [duration, setDuration] = useState(SEVEN_DAYS)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContract, isPending } = useWriteContract()
  const abi = VareFactoryABI as Abi

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash, query: { enabled: !!txHash },
  })

  if (isSuccess && txHash) {
    setTxHash(undefined); setTitle(""); setUrl(""); setDuration(SEVEN_DAYS); setOpen(false)
    onDeployed()
  }

  const handleDeploy = () => {
    if (!isConnected) { openConnectModal?.(); return }
    if (!title.trim()) return
    writeContract(
      {
        address: VARE_FACTORY_ADDRESS,
        abi, functionName: "deploy",
        args: [title.trim(), url.trim(), duration],
        chainId: ACTIVE_CHAIN.id,
      },
      { onSuccess: (hash) => setTxHash(hash), onError: () => {} }
    )
  }

  if (!open) {
    return (
      <button className="p-ghost" onClick={() => isConnected ? setOpen(true) : openConnectModal?.()}>
        + create väre
      </button>
    )
  }

  const isWaiting = isPending || isConfirming

  return (
    <div className="p-create-form">
      <p className="p-label">new gathering</p>

      <div className="p-create-field">
        <label className="p-field-label">what is this gathering around?</label>
        <input
          className="p-field-input"
          placeholder="Gymnopedie No.1 — Erik Satie"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="p-create-field">
        <label className="p-field-label">link to the thing (optional)</label>
        <input
          className="p-field-input"
          placeholder="https://…"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
      </div>

      <div className="p-create-field">
        <label className="p-field-label">how long should it stay open?</label>
        <div className="p-duration">
          {[
            { label: "7 days",  value: SEVEN_DAYS },
            { label: "14 days", value: FOURTEEN_DAYS },
            { label: "28 days", value: TWENTYEIGHT_DAYS },
          ].map(opt => (
            <button
              key={opt.label}
              className={`p-duration-btn ${duration === opt.value ? "p-duration-btn-active" : ""}`}
              onClick={() => setDuration(opt.value)}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      <div className="p-create-actions">
        <button className="p-btn" onClick={handleDeploy} disabled={isWaiting || !title.trim()}>
          {isPending ? "confirm in wallet…" : isConfirming ? "deploying…" : "deploy"}
        </button>
        <button className="p-ghost" onClick={() => setOpen(false)}>cancel</button>
      </div>
    </div>
  )
}
