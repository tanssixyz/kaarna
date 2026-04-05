import { Routes, Route } from "react-router-dom"
import { useAccount } from "wagmi"
import { WalletButton } from "./components/WalletButton"
import { Floor } from "./components/Floor"
import { Archaeology } from "./components/Archaeology"
import { HivenPage } from "./pieces/hiven/HivenPage"
import { KaipuuPage } from "./pieces/kaipuu/KaipuuPage"
import { VarePage } from "./pieces/vare/VarePage"
import { VareDetailPage } from "./pieces/vare/VareDetailPage"
import { PolkuPage } from "./pieces/polku/PolkuPage"

function Home() {
  const { isConnected } = useAccount()
  return (
    <div id="app">
      <header className="site-header">
        <span className="wordmark">kaarna</span>
        <WalletButton />
      </header>
      <main className="site-main">
        {isConnected ? <Archaeology /> : <Floor />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/hiven"       element={<HivenPage />} />
      <Route path="/kaipuu"      element={<KaipuuPage />} />
      <Route path="/vare"        element={<VarePage />} />
      <Route path="/vare/:address" element={<VareDetailPage />} />
      <Route path="/polku"       element={<PolkuPage />} />
      <Route path="*"            element={<Home />} />
    </Routes>
  )
}
