import { WalletSelector } from "../../components/WalletSelector";

export default function HomePage() {
  return (
    <main className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-2xl font-semibold">Track your Sushi LP</h2>
          <p className="mt-2 text-sm text-gray-400">
            Monitor NAV, fees and impermanent loss for the SushiSwap USDC/DAI pool on Gnosis.
            Connect your wallet or paste any address to add it to your watchlist.
          </p>
        </div>
        <WalletSelector />
      </div>
      <div className="card space-y-3">
        <h3 className="text-lg font-semibold">Quick tips</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>Snapshots are stored locally every 15 minutes.</li>
          <li>Impermanent loss is approximated assuming stable pricing.</li>
          <li>
            All transactions are performed directly from your browser via WalletConnect and MetaMask on
            Gnosis.
          </li>
        </ul>
      </div>
    </main>
  );
}
