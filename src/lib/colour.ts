import { keccak256, encodePacked } from "viem"

export function deriveColour(
  markId: bigint,
  timestamp: bigint,
  marker: `0x${string}`
): { h: number; s: number; l: number; css: string; hex: string } {
  const seed = keccak256(
    encodePacked(["uint256", "uint256", "address"], [markId, timestamp, marker])
  )
  const b0 = parseInt(seed.slice(2, 4), 16)
  const b1 = parseInt(seed.slice(4, 6), 16)
  const b2 = parseInt(seed.slice(6, 8), 16)
  const h = Math.floor((b0 * 360) / 256)
  const s = 50 + Math.floor((b1 * 30) / 256)
  const l = 38 + Math.floor((b2 * 24) / 256)
  return { h, s, l, css: `hsl(${h},${s}%,${l}%)`, hex: hslToHex(h, s, l) }
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100
  const ll = l / 100
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function formatDate(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  })
}

export function formatTimeRemaining(closesAt: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (now >= closesAt) return "closed"
  const diff = Number(closesAt - now)
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}
