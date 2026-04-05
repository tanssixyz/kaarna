import { base } from "viem/chains"

export const ACTIVE_CHAIN = base

// ── Contract addresses ────────────────────────────────────────────────────────

export const HIVEN_ADDRESS =
  "0x74f00FE7f08B2623dC6f67EEd05dA9A090a9E139" as const

export const KAIPUU_ADDRESS =
  "0x77b7277A6f737A5166193511388e096f0Bd41093" as const

export const VARE_FACTORY_ADDRESS =
  "0x6066ab4358aC641ffdEE76f8d585eD67028467eD" as const

export const POLKU_ADDRESS =
  "0x039352Ec373fbdCEEd96ab864004eF316F53EdD0" as const

// ── Väre config ───────────────────────────────────────────────────────────────

export const SEVEN_DAYS       = 7n  * 24n * 60n * 60n
export const FOURTEEN_DAYS    = 14n * 24n * 60n * 60n
export const TWENTYEIGHT_DAYS = 28n * 24n * 60n * 60n

export const BLOCKED_VARES: `0x${string}`[] = []

export const CURATOR_ADDRESS =
  "0xa288264B6B1eaD20b977b681Ba9cf3B8a07CBA93" as const

// ── Polku config ──────────────────────────────────────────────────────────────

export const MAX_TURNS = 6
export const MAX_CARRIED_LENGTH = 280

// ── Piece metadata ────────────────────────────────────────────────────────────

export const PIECES = [
  {
    id: "hiven" as const,
    name: "hiven",
    path: "/hiven",
    description: "the smallest gesture outward toward a person",
  },
  {
    id: "kaipuu" as const,
    name: "kaipuu",
    path: "/kaipuu",
    description: "longing marked into permanence, directed toward nothing",
  },
  {
    id: "vare" as const,
    name: "väre",
    path: "/vare",
    description: "gathering around a shared attractor, sealed in time",
  },
  {
    id: "polku" as const,
    name: "polku",
    path: "/polku",
    description: "walking toward what arrives through unmapped territory",
  },
] as const

export type PieceId = (typeof PIECES)[number]["id"]
