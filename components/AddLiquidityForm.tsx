"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchNetwork, useWalletClient } from "wagmi";
import routerAbi from "../lib/abis/uniswapV2Router.json" assert { type: "json" };
import { ADDRESSES } from "../lib/addresses";
import { gnosis } from "../lib/chains";
import { useApprovals } from "../hooks/useApprovals";
import { addFill } from "../lib/storage";
import { positiveNumberString } from "../lib/validation";

interface Props {
  onSettled?: () => void;
}

export function AddLiquidityForm({ onSettled }: Props) {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { switchNetwork } = useSwitchNetwork();
  const { data: walletClient } = useWalletClient({ chainId: gnosis.id });
  const publicClient = usePublicClient({ chainId: gnosis.id });
  const { ensureApproval } = useApprovals(ADDRESSES.ROUTER);

  const [amountUSDC, setAmountUSDC] = useState("0");
  const [amountDAI, setAmountDAI] = useState("0");
  const [slippage, setSlippage] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ready = status === "connected" && chainId === gnosis.id;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address || !walletClient || !publicClient) return;
    try {
      setSubmitting(true);
      setMessage(null);

      const parsedUsdc = positiveNumberString.parse(amountUSDC);
      const parsedDai = positiveNumberString.parse(amountDAI);
      const amountUsdcParsed = parseUnits(parsedUsdc, 6);
      const amountDaiParsed = parseUnits(parsedDai, 18);

      await ensureApproval(ADDRESSES.USDC, amountUsdcParsed);
      await ensureApproval(ADDRESSES.DAI, amountDaiParsed);

      const slippageBps = BigInt(Math.round(slippage * 100));
      const denominator = 10000n;
      const minUsdc = (amountUsdcParsed * (denominator - slippageBps)) / denominator;
      const minDai = (amountDaiParsed * (denominator - slippageBps)) / denominator;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      const hash = await walletClient.writeContract({
        address: ADDRESSES.ROUTER as `0x${string}`,
        abi: routerAbi as const,
        functionName: "addLiquidity",
        args: [
          ADDRESSES.USDC,
          ADDRESSES.DAI,
          amountUsdcParsed,
          amountDaiParsed,
          minUsdc,
          minDai,
          address,
          deadline,
        ],
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setMessage("Liquidity added successfully");
      addFill(address, {
        type: "add",
        usdc: amountUSDC,
        dai: amountDAI,
        tx: hash,
      });
      onSettled?.();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Failed to add liquidity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Add Liquidity</h3>
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
          <label className="block text-xs uppercase tracking-wide text-gray-400">USDC Amount</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={amountUSDC}
            onChange={(e) => setAmountUSDC(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-muted px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-400">DAI Amount</label>
          <input
            type="number"
            min="0"
            step="0.000000000000000001"
            value={amountDAI}
            onChange={(e) => setAmountDAI(e.target.value)}
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
          className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
        >
          {submitting ? "Confirming..." : "Add Liquidity"}
        </button>
      </form>
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
