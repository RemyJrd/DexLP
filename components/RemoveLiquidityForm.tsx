"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient, useSwitchNetwork, useWalletClient } from "wagmi";
import routerAbi from "../lib/abis/uniswapV2Router.json" assert { type: "json" };
import { ADDRESSES } from "../lib/addresses";
import { gnosis } from "../lib/chains";
import { useApprovals } from "../hooks/useApprovals";
import { addFill } from "../lib/storage";

interface Props {
  pair?: string;
  lpBalance?: bigint;
  totalSupply?: bigint;
  reserves?: {
    reserveUSDC: number;
    reserveDAI: number;
  };
  rawReserves?: {
    reserveUSDC: bigint;
    reserveDAI: bigint;
  };
  onSettled?: () => void;
}

export function RemoveLiquidityForm({ pair, lpBalance, totalSupply, reserves, rawReserves, onSettled }: Props) {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { switchNetwork } = useSwitchNetwork();
  const { data: walletClient } = useWalletClient({ chainId: gnosis.id });
  const publicClient = usePublicClient({ chainId: gnosis.id });
  const { ensureApproval } = useApprovals(ADDRESSES.ROUTER);

  const [percentage, setPercentage] = useState(25);
  const [slippage, setSlippage] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ready = status === "connected" && chainId === gnosis.id && pair && lpBalance && lpBalance > 0n;

  const liquidity = useMemo(() => {
    if (!lpBalance) return 0n;
    const bps = BigInt(Math.round(percentage * 100));
    return (lpBalance * bps) / BigInt(10000);
  }, [lpBalance, percentage]);

  const preview = useMemo(() => {
    if (!reserves || !totalSupply || liquidity === 0n) return null;
    const share = Number(liquidity) / Number(totalSupply);
    return {
      usdc: reserves.reserveUSDC * share,
      dai: reserves.reserveDAI * share,
    };
  }, [reserves, totalSupply, liquidity]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address || !walletClient || !publicClient || !pair || liquidity === 0n || !totalSupply || !rawReserves)
      return;
    try {
      setSubmitting(true);
      setMessage(null);

      await ensureApproval(pair, liquidity);

      const expectedUsdcRaw = (rawReserves.reserveUSDC * liquidity) / totalSupply;
      const expectedDaiRaw = (rawReserves.reserveDAI * liquidity) / totalSupply;
      const slippageBps = BigInt(Math.round(slippage * 100));
      const denominator = 10000n;
      const amountAMin = (expectedUsdcRaw * (denominator - slippageBps)) / denominator;
      const amountBMin = (expectedDaiRaw * (denominator - slippageBps)) / denominator;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      const hash = await walletClient.writeContract({
        address: ADDRESSES.ROUTER as `0x${string}`,
        abi: routerAbi as const,
        functionName: "removeLiquidity",
        args: [
          ADDRESSES.USDC,
          ADDRESSES.DAI,
          liquidity,
          amountAMin,
          amountBMin,
          address,
          deadline,
        ],
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setMessage("Liquidity removed successfully");
      if (address) {
        addFill(address, {
          type: "remove",
          pct: percentage,
          tx: hash,
        });
      }
      onSettled?.();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Failed to remove liquidity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Remove Liquidity</h3>
        {chainId !== gnosis.id && (
          <button
            type="button"
            className="rounded-2xl border border-accent px-3 py-2 text-xs"
            onClick={() => switchNetwork?.(gnosis.id)}
          >
            Switch to Gnosis
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-400">Percentage</label>
          <input
            type="number"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl bg-muted px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-400">Slippage (%)</label>
          <input
            type="number"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl bg-muted px-4 py-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!ready || submitting}
          className="w-full rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
        >
          {submitting ? "Confirming..." : "Remove Liquidity"}
        </button>
      </form>
      {liquidity === 0n && <p className="text-sm text-gray-500">No LP balance.</p>}
      {preview && (
        <p className="text-xs text-gray-500">
          Estimated tokens: {preview.usdc.toFixed(2)} USDC & {preview.dai.toFixed(2)} DAI
        </p>
      )}
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
