import { formatUnits } from "viem";

export interface TokenDefinition {
  address: string;
  decimals: number;
}

export interface RawReserve {
  address: string;
  value: bigint;
}

export function mapPairReserves(
  token0: string,
  token1: string,
  reserve0: bigint,
  reserve1: bigint,
  expectedTokens: readonly TokenDefinition[],
): RawReserve[] {
  const rawByAddress = new Map<string, bigint>([
    [token0.toLowerCase(), reserve0],
    [token1.toLowerCase(), reserve1],
  ]);

  return expectedTokens.map((token) => {
    const value = rawByAddress.get(token.address.toLowerCase());

    if (value === undefined) {
      throw new Error(
        `Jeton inattendu dans la pool : ${token0} / ${token1}`,
      );
    }

    return {
      address: token.address,
      value,
    };
  });
}

export function rawToNumber(value: bigint, decimals: number): number {
  const formatted = Number(formatUnits(value, decimals));

  if (!Number.isFinite(formatted)) {
    throw new Error("Montant on-chain trop grand pour être affiché.");
  }

  return formatted;
}

export function shareOfSupply(
  balance: bigint,
  totalSupply: bigint,
  precision = 6,
): number {
  if (balance <= 0n || totalSupply <= 0n) {
    return 0;
  }

  const scale = 10n ** BigInt(precision);
  const scaledFraction = (balance * scale) / totalSupply;

  return (Number(scaledFraction) / Number(scale)) * 100;
}

export function proportionalReserve(
  reserve: bigint,
  balance: bigint,
  totalSupply: bigint,
): bigint {
  if (reserve <= 0n || balance <= 0n || totalSupply <= 0n) {
    return 0n;
  }

  return (reserve * balance) / totalSupply;
}

export function stablePoolMetrics(reserveUsdc: number, reserveWxdai: number) {
  const estimatedTvlUsd = reserveUsdc + reserveWxdai;
  const priceUsdcInWxdai =
    reserveUsdc > 0 ? reserveWxdai / reserveUsdc : 0;
  const pegDeviationPct = Math.abs(priceUsdcInWxdai - 1) * 100;

  return {
    estimatedTvlUsd,
    priceUsdcInWxdai,
    pegDeviationPct,
    weights:
      estimatedTvlUsd > 0
        ? [
            (reserveUsdc / estimatedTvlUsd) * 100,
            (reserveWxdai / estimatedTvlUsd) * 100,
          ]
        : [0, 0],
  };
}

