import { LpManager } from "../../components/LpManager";

export const dynamic = 'force-dynamic';

export default function LpPage() {
  return (
    <main className="space-y-6">
      <div className="card space-y-2">
        <h2 className="text-2xl font-semibold">Manage Liquidity</h2>
        <p className="text-sm text-gray-400">
          Provide or withdraw liquidity for the SushiSwap USDC/DAI pool on Gnosis. Approvals and
          transactions are executed via WalletConnect.
        </p>
      </div>
      <LpManager />
    </main>
  );
}
