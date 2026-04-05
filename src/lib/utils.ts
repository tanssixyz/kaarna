import { createPublicClient, http, isAddress, fallback } from "viem"
import { normalize, toCoinType } from "viem/ens"
import { mainnet, base } from "viem/chains"

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ENS resolution — mainnet client, multiple fallback RPCs
const ensClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://cloudflare-eth.com"),
    http("https://rpc.ankr.com/eth"),
    http("https://ethereum.publicnode.com"),
  ]),
})

export async function resolveAddress(input: string): Promise<string | null> {
  const trimmed = input.trim()
  if (isAddress(trimmed)) return trimmed
  if (!trimmed.includes(".")) return null
  try {
    const normalized = normalize(trimmed)
    if (trimmed.toLowerCase().endsWith(".base.eth")) {
      const baseAddress = await ensClient.getEnsAddress({
        name: normalized,
        coinType: toCoinType(base.id),
      })
      if (baseAddress) return baseAddress
    }
    const ethAddress = await ensClient.getEnsAddress({ name: normalized })
    return ethAddress ?? null
  } catch {
    return null
  }
}
