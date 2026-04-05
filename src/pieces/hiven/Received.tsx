import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useEffect, useState } from "react"
import { HIVEN_ADDRESS } from "../../constants"
import HivenABI from "../../abi/Hiven.json"
import { shortAddress, formatTimestamp } from "../../lib/utils"

interface HivenMark {
  id: bigint
  initiator: string
  initiatedAt: bigint
  acknowledged: boolean
}

export function Received() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [marks, setMarks] = useState<HivenMark[]>([])
  const [loading, setLoading] = useState(false)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!address || !publicClient) return
    setLoading(true)

    publicClient.getLogs({
      address: HIVEN_ADDRESS,
      event: {
        type: "event", name: "Initiated",
        inputs: [
          { name: "id", type: "uint256", indexed: true },
          { name: "initiator", type: "address", indexed: false },
          { name: "receiver", type: "address", indexed: false },
        ],
      },
      fromBlock: 43_748_657n,
      toBlock: "latest",
    }).then(async (logs) => {
      const myLogs = logs.filter((log) =>
        (log.args as { receiver?: string }).receiver?.toLowerCase() === address.toLowerCase()
      )
      const resolved = await Promise.all(
        myLogs.map(async (log) => {
          const args = log.args as { id: bigint; initiator: string }
          const mark = await publicClient.readContract({
            address: HIVEN_ADDRESS,
            abi: HivenABI,
            functionName: "marks",
            args: [args.id],
          }) as readonly [string, string, bigint, bigint, number]
          return {
            id: args.id,
            initiator: args.initiator,
            initiatedAt: mark[2],
            acknowledged: mark[4] === 1,
          }
        })
      )
      setMarks(resolved.reverse())
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [address, publicClient, isSuccess])

  function acknowledge(id: bigint) {
    writeContract({
      address: HIVEN_ADDRESS,
      abi: HivenABI,
      functionName: "acknowledge",
      args: [id],
    })
  }

  if (loading) return (
    <div className="p-card">
      <p className="p-label">received</p>
      <p className="p-sub">looking…</p>
    </div>
  )

  if (marks.length === 0) return (
    <div className="p-card">
      <p className="p-label">received</p>
      <p className="p-sub">no hivens have been sent to this address yet</p>
    </div>
  )

  return (
    <div className="p-card">
      <p className="p-label">received</p>
      <p className="p-sub">hivens sent to your address</p>
      <div className="p-marks-list">
        {marks.map((mark) => (
          <div key={mark.id.toString()} className={`p-mark-item ${mark.acknowledged ? "p-mark-done" : ""}`}>
            <div className="p-mark-row">
              <span className="p-mark-from">{shortAddress(mark.initiator)}</span>
              <span className="p-mark-time">{formatTimestamp(mark.initiatedAt)}</span>
            </div>
            <div className="p-mark-row">
              <span className="p-mark-id">#{mark.id.toString()}</span>
              {mark.acknowledged ? (
                <span className="p-mark-status">acknowledged</span>
              ) : (
                <button
                  className="p-mark-ack"
                  onClick={() => acknowledge(mark.id)}
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? "…" : "acknowledge"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="p-field-error">{(error as { shortMessage?: string }).shortMessage ?? error.message}</p>}
    </div>
  )
}
