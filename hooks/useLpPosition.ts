"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits, getAddress } from "viem";
import factoryAbi from "../lib/abis/uniswapV2Factory.json" assert { type: "json" };
import pairAbi from "../lib/abis/uniswapV2Pair.json" assert { type: "json" };
import { ADDRESSES, BLOCKSCOUT_URL } from "../lib/addresses";
import { gnosis } from "../lib/chains";

export interface LpPositionResult {
  loading: boolean;
  error?: string;
  pair?: string;
  sharePct?: number;
  valueUsd?: number;
  reserves?: {
    reserveUSDC: number;
    reserveDAI: number;
  };
  rawReserves?: {
    reserveUSDC: bigint;
    reserveDAI: bigint;
  };
  totalSupply?: bigint;
  lpBalance?: bigint;
  links?: {
    pair: string;
  };
  refetch: () => void;
}

export function useLpPosition(address?: string | null): LpPositionResult {
  const publicClient = usePublicClient({ chainId: gnosis.id });
  const [state, setState] = useState<Omit<LpPositionResult, "refetch">>({ loading: true });
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!address) {
      setState({ loading: false });
      return;
    }

    if (!publicClient) {
      setState({ loading: false, error: "Missing public client" });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: undefined }));

        const pairAddress = await publicClient.readContract({
          address: getAddress(ADDRESSES.FACTORY),
          abi: factoryAbi as const,
          functionName: "getPair",
          args: [getAddress(ADDRESSES.USDC), getAddress(ADDRESSES.DAI)],
        });

        if (!pairAddress || pairAddress === "0x0000000000000000000000000000000000000000") {
          if (!cancelled) {
            setState({
              loading: false,
              error: "Pair not found",
            });
          }
          return;
        }

        const [token0, token1] = await Promise.all([
          publicClient.readContract({ address: pairAddress, abi: pairAbi as const, functionName: "token0" }),
          publicClient.readContract({ address: pairAddress, abi: pairAbi as const, functionName: "token1" }),
        ]);

        const { reserve0, reserve1 } = await publicClient.readContract({
          address: pairAddress,
          abi: pairAbi as const,
          functionName: "getReserves",
        }) as { reserve0: bigint; reserve1: bigint; blockTimestampLast: number };

        const [totalSupply, lpBalance] = await Promise.all([
          publicClient.readContract({
            address: pairAddress,
            abi: pairAbi as const,
            functionName: "totalSupply",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: pairAddress,
            abi: pairAbi as const,
            functionName: "balanceOf",
            args: [getAddress(address)],
          }) as Promise<bigint>,
        ]);

        const reserveUSDCBigInt = token0.toLowerCase() === ADDRESSES.USDC.toLowerCase() ? reserve0 : reserve1;
        const reserveDAIBigInt = token0.toLowerCase() === ADDRESSES.DAI.toLowerCase() ? reserve0 : reserve1;
        const reservesMapped = {
          reserveUSDC: Number(formatUnits(reserveUSDCBigInt, 6)),
          reserveDAI: Number(formatUnits(reserveDAIBigInt, 18)),
        };

        const sharePct = totalSupply === 0n ? 0 : Number(lpBalance) / Number(totalSupply) * 100;
        const totalValue = reservesMapped.reserveUSDC + reservesMapped.reserveDAI;
        const valueUsd = totalValue * (sharePct / 100);

        if (!cancelled) {
          setState({
            loading: false,
            pair: pairAddress,
            sharePct,
            valueUsd,
            reserves: reservesMapped,
            rawReserves: {
              reserveUSDC: reserveUSDCBigInt,
              reserveDAI: reserveDAIBigInt,
            },
            totalSupply,
            lpBalance,
            links: {
              pair: `${BLOCKSCOUT_URL}/address/${pairAddress}`,
            },
          });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setState({ loading: false, error: error instanceof Error ? error.message : "Failed to load position" });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [publicClient, address, refreshIndex]);

  const value = useMemo(
    () => ({
      ...state,
      refetch: () => setRefreshIndex((index) => index + 1),
    }),
    [state]
  );

  return value;
}
