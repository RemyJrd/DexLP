import {
  asCatalogChain,
  asDexProject,
  CATALOG_CHAINS,
  DEX_PROJECT_LABELS,
  type CatalogFilters,
  type CatalogPool,
  type CatalogSelection,
  type CatalogChain,
} from "./catalog-types";

export const CATALOG_MINIMUM_TVL_USD = 10_000;
export const CATALOG_MAXIMUM_POOLS_PER_CHAIN = 40;

export class CatalogPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogPayloadError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function optionalString(value: unknown): string | null {
  return requiredString(value);
}

function nullableNumber(
  value: unknown,
  options: { nonNegative?: boolean } = {},
): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return null;
  if (options.nonNegative && parsed < 0) return null;
  return parsed;
}

function nullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const parsed = requiredString(item);
    if (!parsed) continue;

    const key = parsed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(parsed);
  }

  return result;
}

function normalizeIlRisk(value: unknown): "yes" | "no" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "yes" || normalized === "no" ? normalized : null;
}

function normalizeExposure(value: unknown): "single" | "multi" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "single" || normalized === "multi"
    ? normalized
    : null;
}

function normalizePool(value: unknown): CatalogPool | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.pool);
  const rawChain = requiredString(value.chain);
  const rawProject = requiredString(value.project);
  const symbol = requiredString(value.symbol);

  if (!id || !rawChain || !rawProject || !symbol) return null;

  const chain = asCatalogChain(rawChain);
  const project = asDexProject(rawProject);
  if (!chain || !project) return null;

  return {
    id,
    chain,
    project,
    protocolName: DEX_PROJECT_LABELS[project],
    symbol,
    tvlUsd: nullableNumber(value.tvlUsd, { nonNegative: true }),
    apy: nullableNumber(value.apy),
    apyBase: nullableNumber(value.apyBase),
    apyReward: nullableNumber(value.apyReward),
    apyMean30d: nullableNumber(value.apyMean30d),
    apyPct7D: nullableNumber(value.apyPct7D),
    volumeUsd1d: nullableNumber(value.volumeUsd1d, { nonNegative: true }),
    volumeUsd7d: nullableNumber(value.volumeUsd7d, { nonNegative: true }),
    underlyingTokens: stringArray(value.underlyingTokens),
    rewardTokens: stringArray(value.rewardTokens),
    stablecoin: nullableBoolean(value.stablecoin),
    ilRisk: normalizeIlRisk(value.ilRisk),
    exposure: normalizeExposure(value.exposure),
    poolMeta: optionalString(value.poolMeta),
    outlier: nullableBoolean(value.outlier),
    sourceUrl: `https://defillama.com/yields/pool/${encodeURIComponent(id)}`,
  };
}

export function normalizeDefiLlamaPools(payload: unknown): CatalogPool[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new CatalogPayloadError(
      "La réponse DefiLlama ne contient pas de tableau data.",
    );
  }

  if (
    payload.status !== undefined &&
    payload.status !== null &&
    payload.status !== "success"
  ) {
    throw new CatalogPayloadError("DefiLlama a renvoyé un statut non valide.");
  }

  const byId = new Map<string, CatalogPool>();

  for (const rawPool of payload.data) {
    const pool = normalizePool(rawPool);
    if (!pool) continue;

    const key = pool.id.toLowerCase();
    const previous = byId.get(key);
    const previousTvl = previous?.tvlUsd ?? Number.NEGATIVE_INFINITY;
    const currentTvl = pool.tvlUsd ?? Number.NEGATIVE_INFINITY;

    if (!previous || currentTvl > previousTvl) {
      byId.set(key, pool);
    }
  }

  return [...byId.values()];
}

function descendingNullable(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

export function compareCatalogPools(
  left: CatalogPool,
  right: CatalogPool,
): number {
  const byTvl = descendingNullable(left.tvlUsd, right.tvlUsd);
  if (byTvl !== 0) return byTvl;

  const byApy = descendingNullable(left.apy, right.apy);
  if (byApy !== 0) return byApy;

  const byChain =
    CATALOG_CHAINS.indexOf(left.chain) - CATALOG_CHAINS.indexOf(right.chain);
  if (byChain !== 0) return byChain;

  return (
    left.project.localeCompare(right.project) ||
    left.symbol.localeCompare(right.symbol) ||
    left.id.localeCompare(right.id)
  );
}

function emptyChainCounts(): Record<CatalogChain, number> {
  return Object.fromEntries(
    CATALOG_CHAINS.map((chain) => [chain, 0]),
  ) as Record<CatalogChain, number>;
}

export function selectCatalogPools(
  pools: readonly CatalogPool[],
  filters: CatalogFilters = {},
): CatalogSelection {
  const eligible = pools.filter(
    (pool) =>
      pool.outlier !== true &&
      pool.exposure === "multi" &&
      pool.underlyingTokens.length >= 2 &&
      pool.tvlUsd !== null &&
      pool.tvlUsd >= CATALOG_MINIMUM_TVL_USD,
  );

  const normalizedId = filters.id?.trim().toLowerCase();
  const matched = eligible.filter((pool) => {
    if (normalizedId && pool.id.toLowerCase() !== normalizedId) return false;
    if (filters.chain && pool.chain !== filters.chain) return false;
    if (filters.project && pool.project !== filters.project) return false;
    return true;
  });

  const selectedByChain = emptyChainCounts();
  const selected: CatalogPool[] = [];

  for (const chain of CATALOG_CHAINS) {
    const chainPools = matched
      .filter((pool) => pool.chain === chain)
      .sort(compareCatalogPools)
      .slice(0, CATALOG_MAXIMUM_POOLS_PER_CHAIN);

    selectedByChain[chain] = chainPools.length;
    selected.push(...chainPools);
  }

  selected.sort(compareCatalogPools);

  return {
    pools: selected,
    eligibleCount: eligible.length,
    matchedCount: matched.length,
    selectedByChain,
  };
}
