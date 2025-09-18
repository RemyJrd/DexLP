"use client";

import Link from "next/link";
import { ADDRESSES, BLOCKSCOUT_URL, PAIR_SYMBOL } from "../lib/addresses";
import type { LpPositionResult } from "../hooks/useLpPosition";

interface Props {
  position: LpPositionResult;
  address?: string | null;
}

export function PositionsTable({ position, address }: Props) {
  if (position.loading) {
    return <div className="card">Loading LP position...</div>;
  }

  if (position.error) {
    return <div className="card text-red-400">{position.error}</div>;
  }

  if (!position.pair) {
    return <div className="card">No LP position detected.</div>;
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Positions</h3>
          <p className="text-sm text-gray-400">{PAIR_SYMBOL} Sushi v2</p>
        </div>
        {address && (
          <Link href={`${BLOCKSCOUT_URL}/address/${address}`} className="text-sm text-accent">
            View wallet ↗
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-gray-400">Share</p>
          <p className="text-lg font-semibold">{(position.sharePct ?? 0).toFixed(4)}%</p>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-gray-400">Value (USD)</p>
          <p className="text-lg font-semibold">${(position.valueUsd ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-gray-400">Reserves USDC</p>
          <p className="text-lg font-semibold">{position.reserves ? position.reserves.reserveUSDC.toFixed(2) : "-"}</p>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-gray-400">Reserves DAI</p>
          <p className="text-lg font-semibold">{position.reserves ? position.reserves.reserveDAI.toFixed(2) : "-"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <Link href={`${BLOCKSCOUT_URL}/address/${position.pair}`}>Pair ↗</Link>
        <Link href={`${BLOCKSCOUT_URL}/address/${ADDRESSES.ROUTER}`}>Router ↗</Link>
        <Link href={`${BLOCKSCOUT_URL}/address/${ADDRESSES.FACTORY}`}>Factory ↗</Link>
      </div>
    </div>
  );
}
