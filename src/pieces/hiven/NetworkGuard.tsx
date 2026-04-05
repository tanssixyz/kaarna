import { useChainId, useSwitchChain } from "wagmi"
import { base } from "viem/chains"

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (chainId === base.id) return <>{children}</>

  return (
    <div className="p-card">
      <p className="p-label">wrong network</p>
      <p className="p-sub">hiven runs on Base — switch to continue</p>
      <button className="p-btn" onClick={() => switchChain({ chainId: base.id })} disabled={isPending}>
        {isPending ? "switching…" : "switch to Base"}
      </button>
    </div>
  )
}
