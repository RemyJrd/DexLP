import { describe, expect, it } from "vitest";
import {
  mapPairReserves,
  proportionalReserve,
  shareOfSupply,
  stablePoolMetrics,
} from "./pool-math";

const usdc = {
  address: "0x0000000000000000000000000000000000000001",
  decimals: 6,
};
const wxdai = {
  address: "0x0000000000000000000000000000000000000002",
  decimals: 18,
};

describe("mapPairReserves", () => {
  it("mappe les réserves dans l’ordre fonctionnel", () => {
    const mapped = mapPairReserves(
      usdc.address,
      wxdai.address,
      125n,
      250n,
      [usdc, wxdai],
    );

    expect(mapped.map((item) => item.value)).toEqual([125n, 250n]);
  });

  it("mappe correctement une paire dont token0/token1 sont inversés", () => {
    const mapped = mapPairReserves(
      wxdai.address,
      usdc.address,
      250n,
      125n,
      [usdc, wxdai],
    );

    expect(mapped.map((item) => item.value)).toEqual([125n, 250n]);
  });
});

describe("LP calculations", () => {
  it("calcule une part du supply sans convertir les bigint trop tôt", () => {
    expect(shareOfSupply(125n, 1_000n)).toBe(12.5);
    expect(shareOfSupply(0n, 1_000n)).toBe(0);
  });

  it("calcule le sous-jacent d’un holder", () => {
    expect(proportionalReserve(2_000n, 125n, 1_000n)).toBe(250n);
  });
});

describe("stablePoolMetrics", () => {
  it("calcule TVL, prix et écart au peg", () => {
    const result = stablePoolMetrics(100, 99);

    expect(result.estimatedTvlUsd).toBe(199);
    expect(result.priceUsdcInWxdai).toBe(0.99);
    expect(result.pegDeviationPct).toBeCloseTo(1);
    expect(result.weights[0] + result.weights[1]).toBeCloseTo(100);
  });
});

