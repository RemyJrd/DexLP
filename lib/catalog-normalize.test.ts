import { describe, expect, it } from "vitest";
import {
  CATALOG_MAXIMUM_POOLS_PER_CHAIN,
  CATALOG_MINIMUM_TVL_USD,
  CatalogPayloadError,
  normalizeDefiLlamaPools,
  selectCatalogPools,
} from "./catalog-normalize";

function sourcePool(
  id: string,
  chain: string,
  project: string,
  tvlUsd: unknown,
  overrides: Record<string, unknown> = {},
) {
  return {
    pool: id,
    chain,
    project,
    symbol: `${id}-LP`,
    tvlUsd,
    apy: 3.5,
    exposure: "multi",
    underlyingTokens: ["0xTokenA", "0xTokenB"],
    ...overrides,
  };
}

describe("normalizeDefiLlamaPools", () => {
  it("conserve les métriques utiles et normalise les valeurs nulles", () => {
    const [pool] = normalizeDefiLlamaPools({
      status: "success",
      data: [
        sourcePool("gnosis-pool", "gnosis", "sushiswap", "25000.50", {
          apy: null,
          apyBase: "1.25",
          apyReward: undefined,
          apyMean30d: "2.75",
          apyPct7D: -0.4,
          volumeUsd1d: "1200",
          volumeUsd7d: null,
          underlyingTokens: ["0xA", "0xA", "", 42, "0xB"],
          rewardTokens: null,
          stablecoin: true,
          ilRisk: "no",
          exposure: "multi",
          poolMeta: "Stable 0.01%",
          outlier: false,
        }),
      ],
    });

    expect(pool).toMatchObject({
      id: "gnosis-pool",
      chain: "Gnosis",
      project: "sushiswap",
      protocolName: "SushiSwap",
      tvlUsd: 25_000.5,
      apy: null,
      apyBase: 1.25,
      apyReward: null,
      apyMean30d: 2.75,
      apyPct7D: -0.4,
      volumeUsd1d: 1_200,
      volumeUsd7d: null,
      underlyingTokens: ["0xA", "0xB"],
      rewardTokens: [],
      stablecoin: true,
      ilRisk: "no",
      poolMeta: "Stable 0.01%",
      outlier: false,
    });
  });

  it("ignore les chaînes, protocoles et lignes hors allowlist ou mal formées", () => {
    const pools = normalizeDefiLlamaPools({
      status: "success",
      data: [
        sourcePool("ethereum-uni", "Ethereum", "uniswap-v3", 50_000),
        sourcePool("solana-orca", "Solana", "orca-dex", 50_000),
        sourcePool("ethereum-aave", "Ethereum", "aave-v3", 50_000),
        { chain: "Ethereum", project: "uniswap-v3", tvlUsd: 50_000 },
      ],
    });

    expect(pools.map((pool) => pool.id)).toEqual(["ethereum-uni"]);
  });

  it("rejette une enveloppe source invalide", () => {
    expect(() => normalizeDefiLlamaPools({ status: "success" })).toThrow(
      CatalogPayloadError,
    );
    expect(() =>
      normalizeDefiLlamaPools({ status: "error", data: [] }),
    ).toThrow(CatalogPayloadError);
  });
});

describe("selectCatalogPools", () => {
  it("exclut les outliers, entrées non LP, TVL nulles et TVL sous le seuil", () => {
    const pools = normalizeDefiLlamaPools({
      status: "success",
      data: [
        sourcePool("eligible", "Gnosis", "curve-dex", 25_000),
        sourcePool("boundary", "Gnosis", "curve-dex", 10_000),
        sourcePool("too-small", "Gnosis", "curve-dex", 9_999),
        sourcePool("null-tvl", "Gnosis", "curve-dex", null),
        sourcePool("outlier", "Gnosis", "curve-dex", 1_000_000, {
          outlier: true,
        }),
        sourcePool("single-exposure", "Gnosis", "curve-dex", 40_000, {
          exposure: "single",
        }),
        sourcePool("one-token", "Gnosis", "curve-dex", 40_000, {
          underlyingTokens: ["0xTokenA"],
        }),
      ],
    });

    const selected = selectCatalogPools(pools);

    expect(CATALOG_MINIMUM_TVL_USD).toBe(10_000);
    expect(selected.pools.map((pool) => pool.id)).toEqual([
      "eligible",
      "boundary",
    ]);
    expect(selected.eligibleCount).toBe(2);
  });

  it("applique le quota avant le tri global afin de préserver chaque chaîne", () => {
    const gnosis = Array.from(
      { length: CATALOG_MAXIMUM_POOLS_PER_CHAIN + 3 },
      (_, index) =>
        sourcePool(
          `gnosis-${index}`,
          "Gnosis",
          "sushiswap",
          1_000_000 - index,
        ),
    );
    const ethereum = [
      sourcePool("ethereum-1", "Ethereum", "uniswap-v3", 20_000),
      sourcePool("ethereum-2", "Ethereum", "curve-dex", 15_000),
    ];
    const pools = normalizeDefiLlamaPools({
      status: "success",
      data: [...gnosis, ...ethereum],
    });

    const selected = selectCatalogPools(pools);

    expect(selected.selectedByChain.Gnosis).toBe(
      CATALOG_MAXIMUM_POOLS_PER_CHAIN,
    );
    expect(selected.selectedByChain.Ethereum).toBe(2);
    expect(selected.pools.filter((pool) => pool.chain === "Ethereum")).toHaveLength(
      2,
    );
    expect(selected.pools).toHaveLength(
      CATALOG_MAXIMUM_POOLS_PER_CHAIN + 2,
    );
  });

  it("filtre une pool par identifiant sans perdre les règles d'éligibilité", () => {
    const pools = normalizeDefiLlamaPools({
      status: "success",
      data: [
        sourcePool("Pool-A", "Base", "aerodrome-v1", 30_000),
        sourcePool("Pool-B", "Base", "aerodrome-v1", 20_000),
      ],
    });

    const selected = selectCatalogPools(pools, { id: "pool-b" });

    expect(selected.matchedCount).toBe(1);
    expect(selected.pools.map((pool) => pool.id)).toEqual(["Pool-B"]);
  });
});
