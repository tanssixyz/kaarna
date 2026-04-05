import { ConnectButton } from "@rainbow-me/rainbowkit"

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        if (!mounted) return null

        if (!account || !chain) {
          return (
            <button className="wallet-btn" onClick={openConnectModal} type="button">
              connect
            </button>
          )
        }

        // Connected: use RainbowKit's own ConnectButton directly
        // It handles account modal, disconnect, chain switching internally
        return <ConnectButton />
      }}
    </ConnectButton.Custom>
  )
}
