"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getAddress } from "viem";
import erc20Abi from "../lib/abis/erc20.json" assert { type: "json" };
import { gnosis } from "../lib/chains";

export function useApprovals(spender: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: gnosis.id });
  const { data: walletClient } = useWalletClient({ chainId: gnosis.id });
  const [allowances, setAllowances] = useState<Record<string, bigint>>({});

  const refreshAllowance = useCallback(
    async (token: string) => {
      if (!address || !publicClient) return 0n;
      const value = (await publicClient.readContract({
        address: getAddress(token),
        abi: erc20Abi as const,
        functionName: "allowance",
        args: [getAddress(address), getAddress(spender)],
      })) as bigint;
      setAllowances((prev) => ({ ...prev, [token.toLowerCase()]: value }));
      return value;
    },
    [address, publicClient, spender]
  );

  const ensureApproval = useCallback(
    async (token: string, amount: bigint) => {
      if (!walletClient) throw new Error("Wallet client unavailable");
      if (!address) throw new Error("Wallet not connected");
      const current = allowances[token.toLowerCase()] ?? (await refreshAllowance(token));
      if (current >= amount) return current;
      const hash = await walletClient.writeContract({
        address: getAddress(token),
        abi: erc20Abi as const,
        functionName: "approve",
        args: [getAddress(spender), amount],
        account: getAddress(address),
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      return refreshAllowance(token);
    },
    [walletClient, address, allowances, refreshAllowance, publicClient, spender]
  );

  return {
    allowances,
    refreshAllowance,
    ensureApproval,
  };
}
