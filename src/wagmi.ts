import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base } from "viem/chains"
import { http, fallback } from "wagmi"

const alchemyUrl = import.meta.env.VITE_BASE_RPC as string | undefined

const BASE_TRANSPORT = fallback([
  ...(alchemyUrl ? [http(alchemyUrl, { timeout: 20_000 })] : []),
  http("https://base.llamarpc.com",       { timeout: 20_000 }),
  http("https://base-rpc.publicnode.com", { timeout: 20_000 }),
  http("https://mainnet.base.org",        { timeout: 20_000 }),
])

export const config = getDefaultConfig({
  appName: "Kaarna",
  appDescription: "A collection of small on-chain gestures at the edge of presence and encounter.",
  appUrl: "https://kaarna.xyz",
  appIcon: "https://kaarna.xyz/favicon.svg",
  projectId: "6ba1bf292b158f48a08b2056365fcd65",
  chains: [base],
  transports: {
    [base.id]: BASE_TRANSPORT,
  },
  ssr: false,
})
