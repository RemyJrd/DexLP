import type { Metadata } from "next";
import { PoolDashboard } from "../../../../../components/PoolDashboard";

export const metadata: Metadata = {
  title: "USDC / WXDAI sur Gnosis — DexLP",
  description:
    "Analyse on-chain détaillée de la pool SushiSwap V2 USDC/WXDAI sur Gnosis.",
};

export default function GnosisSushiPoolPage() {
  return <PoolDashboard />;
}
