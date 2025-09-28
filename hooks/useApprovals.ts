"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useConnectorClient } from "wagmi";
import { getAddress } from "viem";
import { erc20Abi } from "../lib/abis";
import { gnosis, wagmiConfig } from "../lib/chains";
import { writeContract } from "wagmi/actions";

export function useApprovals(spender: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: gnosis.id });
  const { data: walletClient } = useConnectorClient({ chainId: gnosis.id });
  const [allowances, setAllowances] = useState<Record<string, bigint>>({});

  const refreshAllowance = useCallback(
    async (token: string) => {
      if (!address || !publicClient) return 0n;
      const value = (await publicClient.readContract({
        address: getAddress(token),
        abi: erc20Abi,
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
      const hash = await writeContract(wagmiConfig, {
        address: getAddress(token),
        abi: erc20Abi,
        functionName: "approve",
        args: [getAddress(spender), amount],
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
