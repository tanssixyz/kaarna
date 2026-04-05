import { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import { type Address, type AbiEvent, type Log, parseAbiItem } from "viem"
import {
  HIVEN_ADDRESS,
  KAIPUU_ADDRESS,
  VARE_FACTORY_ADDRESS,
  POLKU_ADDRESS,
  type PieceId,
} from "../constants"

// ── Types ─────────────────────────────────────────────────────────────────────

export type KaarnaEvent = {
  piece: PieceId
  kind: string
  timestamp: bigint
  blockNumber: bigint
  txHash: `0x${string}`
  data?: Record<string, string>
}

export type KaarnaHistory = {
  events: KaarnaEvent[]
  loading: boolean
  error: string | null
  total: number
}

// ── Deploy blocks — verified from broadcast receipts ──────────────────────────
// hiven:  0x29b8d31 = 43,748,657
// kaipuu: 0x29d4f5d = 43,863,901
// vare:   0x2a01376 = 44,045,174
// polku:  0x2a20f1e = 44,175,134

const DEPLOY_BLOCKS = {
  hiven:  43_748_657n,
  kaipuu: 43_863_901n,
  vare:   44_045_174n,
  polku:  44_175_134n,
} as const

const CHUNK = 9_000n
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2_000
const INTER_CHUNK_DELAY_MS = 100  // brief pause between chunks to avoid rate limits

// ── ABI event items ───────────────────────────────────────────────────────────

const EV_HIVEN_INITIATED = parseAbiItem(
  "event Initiated(uint256 indexed id, address initiator, address receiver)"
) as AbiEvent

const EV_KAIPUU_MARKED = parseAbiItem(
  "event Marked(uint256 indexed id, address indexed marker, uint256 timestamp)"
) as AbiEvent

const EV_VARE_MARKED = parseAbiItem(
  "event Marked(uint256 indexed id, address indexed marker, uint256 timestamp)"
) as AbiEvent

const EV_FACTORY_DEPLOYED = {
  type: "event",
  name: "VareDeployed",
  inputs: [
    { name: "vare",       type: "address", indexed: true  },
    { name: "creator",    type: "address", indexed: true  },
    { name: "title",      type: "string",  indexed: false },
    { name: "url",        type: "string",  indexed: false },
    { name: "duration",   type: "uint256", indexed: false },
    { name: "deployedAt", type: "uint256", indexed: false },
  ],
} as const satisfies AbiEvent

const EV_POLKU_WALKED = {
  type: "event",
  name: "Walked",
  inputs: [
    { name: "id",        type: "uint256", indexed: true  },
    { name: "walker",    type: "address", indexed: true  },
    { name: "timestamp", type: "uint256", indexed: false },
    { name: "carried",   type: "string",  indexed: false },
  ],
} as const satisfies AbiEvent

// ── Helpers ───────────────────────────────────────────────────────────────────

type Client = NonNullable<ReturnType<typeof usePublicClient>>
type DecodedLog = Log & { args: Record<string, unknown> }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getLogsWithRetry(
  client: Client,
  args: Parameters<Client["getLogs"]>[0],
  attempt = 0
): Promise<DecodedLog[]> {
  try {
    return (await client.getLogs(args)) as unknown as DecodedLog[]
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err
    const msg = err instanceof Error ? err.message : ""
    const isRetryable =
      msg.includes("timed out") ||
      msg.includes("timeout") ||
      msg.includes("took too long") ||
      msg.includes("rate limit") ||
      msg.includes("over rate") ||
      msg.includes("429")
    if (!isRetryable) throw err
    await sleep(RETRY_DELAY_MS * (attempt + 1))
    return getLogsWithRetry(client, args, attempt + 1)
  }
}

async function paginate(
  client: Client,
  address: Address | Address[],
  event: AbiEvent,
  fromBlock: bigint,
  toBlock: bigint
): Promise<DecodedLog[]> {
  const results: DecodedLog[] = []
  let from = fromBlock
  while (from <= toBlock) {
    const to = from + CHUNK - 1n <= toBlock ? from + CHUNK - 1n : toBlock
    const logs = await getLogsWithRetry(client, {
      address,
      event,
      fromBlock: from,
      toBlock: to,
    })
    results.push(...logs)
    from = to + 1n
    // small pause between chunks so we don't burst the RPC rate limit
    if (from <= toBlock) await sleep(INTER_CHUNK_DELAY_MS)
  }
  return results
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKaarnaHistory(address: Address | undefined): KaarnaHistory {
  const client = usePublicClient()
  const [events, setEvents] = useState<KaarnaEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || !client) {
      setEvents([])
      return
    }

    const wallet: Address = address
    const c: Client = client
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const collected: KaarnaEvent[] = []
        const latest = await c.getBlockNumber()
        const addr = wallet.toLowerCase()

        // ── Hiven ────────────────────────────────────────────────────────────
        const hivenLogs = await paginate(c, HIVEN_ADDRESS, EV_HIVEN_INITIATED, DEPLOY_BLOCKS.hiven, latest)
        for (const log of hivenLogs) {
          const initiator = log.args["initiator"] as Address | undefined
          const receiver  = log.args["receiver"]  as Address | undefined
          if (initiator?.toLowerCase() === addr) {
            collected.push({
              piece: "hiven", kind: "sent", timestamp: 0n,
              blockNumber: log.blockNumber ?? 0n,
              txHash: log.transactionHash ?? "0x0",
              data: receiver ? { to: receiver } : undefined,
            })
          }
          if (receiver?.toLowerCase() === addr) {
            collected.push({
              piece: "hiven", kind: "received", timestamp: 0n,
              blockNumber: log.blockNumber ?? 0n,
              txHash: log.transactionHash ?? "0x0",
              data: initiator ? { from: initiator } : undefined,
            })
          }
        }

        // ── Kaipuu ───────────────────────────────────────────────────────────
        const kaipuuLogs = await paginate(c, KAIPUU_ADDRESS, EV_KAIPUU_MARKED, DEPLOY_BLOCKS.kaipuu, latest)
        for (const log of kaipuuLogs) {
          const marker    = log.args["marker"]    as Address | undefined
          const timestamp = log.args["timestamp"] as bigint  | undefined
          if (marker?.toLowerCase() !== addr) continue
          collected.push({
            piece: "kaipuu", kind: "marked",
            timestamp: timestamp ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash ?? "0x0",
          })
        }

        // ── Väre ─────────────────────────────────────────────────────────────
        const vareLogs = await paginate(c, VARE_FACTORY_ADDRESS, EV_FACTORY_DEPLOYED, DEPLOY_BLOCKS.vare, latest)
        const vareTitles: Record<string, string> = {}
        const vareAddresses: Address[] = []
        for (const vl of vareLogs) {
          const vare  = vl.args["vare"]  as Address | undefined
          const title = vl.args["title"] as string  | undefined
          if (vare) {
            vareAddresses.push(vare)
            vareTitles[vare.toLowerCase()] = title ?? ""
          }
        }

        if (vareAddresses.length > 0) {
          const vareResults = await Promise.allSettled(
            vareAddresses.map((vare) =>
              paginate(c, vare, EV_VARE_MARKED, DEPLOY_BLOCKS.vare, latest)
            )
          )
          for (let i = 0; i < vareResults.length; i++) {
            const r = vareResults[i]
            if (r.status === "rejected") continue
            const title = vareTitles[vareAddresses[i].toLowerCase()] ?? ""
            for (const log of r.value) {
              const marker    = log.args["marker"]    as Address | undefined
              const timestamp = log.args["timestamp"] as bigint  | undefined
              if (marker?.toLowerCase() !== addr) continue
              collected.push({
                piece: "vare", kind: "gathered",
                timestamp: timestamp ?? 0n,
                blockNumber: log.blockNumber ?? 0n,
                txHash: log.transactionHash ?? "0x0",
                data: title ? { title } : undefined,
              })
            }
          }
        }

        // ── Polku ────────────────────────────────────────────────────────────
        const polkuLogs = await paginate(c, POLKU_ADDRESS, EV_POLKU_WALKED, DEPLOY_BLOCKS.polku, latest)
        for (const log of polkuLogs) {
          const walker    = log.args["walker"]    as Address | undefined
          const timestamp = log.args["timestamp"] as bigint  | undefined
          const carried   = log.args["carried"]   as string  | undefined
          if (walker?.toLowerCase() !== addr) continue
          collected.push({
            piece: "polku", kind: "walked",
            timestamp: timestamp ?? 0n,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash ?? "0x0",
            data: carried ? { carried } : undefined,
          })
        }

        // ── Resolve Hiven block timestamps ───────────────────────────────────
        const hivenPending = collected.filter(
          (e) => e.piece === "hiven" && e.timestamp === 0n
        )
        if (hivenPending.length > 0) {
          const uniqueBlocks = [...new Set(hivenPending.map((e) => e.blockNumber))]
          const blockResults = await Promise.allSettled(
            uniqueBlocks.map((bn) => c.getBlock({ blockNumber: bn }))
          )
          const ts: Record<string, bigint> = {}
          for (let i = 0; i < uniqueBlocks.length; i++) {
            const r = blockResults[i]
            if (r.status === "fulfilled") ts[uniqueBlocks[i].toString()] = r.value.timestamp
          }
          for (const e of collected) {
            if (e.piece === "hiven" && e.timestamp === 0n) {
              e.timestamp = ts[e.blockNumber.toString()] ?? 0n
            }
          }
        }

        if (!cancelled) {
          collected.sort((a, b) =>
            b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0
          )
          setEvents(collected)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[kaarna] history fetch failed:", err)
          setError(err instanceof Error ? err.message : "failed to read history")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => { cancelled = true }
  }, [address, client])

  return { events, loading, error, total: events.length }
}
