"use client";

import Link from "next/link";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { gnosis } from "../lib/chains";
import { useLpPosition } from "../hooks/useLpPosition";
import { useNavSeries } from "../hooks/useNavSeries";
import { NavChart } from "./NavChart";
import { IlChart } from "./IlChart";
import { PositionsTable } from "./PositionsTable";

interface Props {
  address: string;
}

export function WalletDashboard({ address }: Props) {
  const normalized = address.toLowerCase();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const position = useLpPosition(normalized);
  const { series, latest } = useNavSeries(normalized, position.valueUsd, position.rawReserves);
  const startNav = series[0]?.nav ?? position.valueUsd ?? 0;
  const currentNav = latest?.nav ?? position.valueUsd ?? 0;
  const pnl = currentNav - startNav;
  const il = latest?.il ?? 0;
  const showSwitch = isConnected && chainId !== gnosis.id;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase text-gray-400">NAV (USD)</p>
          <p className="mt-2 text-2xl font-semibold">${currentNav.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-400">PNL</p>
          <p className={`mt-2 text-2xl font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-gray-400">IL %</p>
          <p className="mt-2 text-2xl font-semibold">{(il * 100).toFixed(3)}%</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <NavChart series={series} />
        <IlChart series={series} />
      </div>
      <PositionsTable position={position} address={normalized} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/lp" className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-black">
          Manage liquidity
        </Link>
        {showSwitch && (
          <button
            onClick={() => switchChain?.({ chainId: gnosis.id })}
            className="rounded-2xl border border-accent px-4 py-2 text-xs"
          >
            Switch to Gnosis
          </button>
        )}
      </div>
    </div>
  );
}
