import "server-only";

import {
  CATALOG_CHAINS,
  DEX_PROJECTS,
  type CatalogFilters,
  type PoolCatalogResponse,
} from "./catalog-types";
import {
  CATALOG_MAXIMUM_POOLS_PER_CHAIN,
  CATALOG_MINIMUM_TVL_USD,
  normalizeDefiLlamaPools,
  selectCatalogPools,
} from "./catalog-normalize";

const DEFAULT_DEFILLAMA_YIELDS_URL = "https://yields.llama.fi/pools";
export const CATALOG_REVALIDATE_SECONDS = 3_600;

function getSourceUrl(): string {
  return (
    process.env.DEFILLAMA_YIELDS_URL ?? DEFAULT_DEFILLAMA_YIELDS_URL
  ).trim();
}

async function fetchDefiLlamaPayload(): Promise<unknown> {
  const sourceUrl = getSourceUrl();
  let response: Response;

  try {
    response = await fetch(sourceUrl, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: CATALOG_REVALIDATE_SECONDS,
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    throw new Error("Impossible de joindre DefiLlama Yields.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(`DefiLlama Yields a répondu HTTP ${response.status}.`);
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new Error("La réponse DefiLlama Yields n'est pas un JSON valide.", {
      cause: error,
    });
  }
}

export async function getPoolCatalog(
  filters: CatalogFilters = {},
): Promise<PoolCatalogResponse> {
  const payload = await fetchDefiLlamaPayload();
  const sourceRows =
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    Array.isArray(payload.data)
      ? payload.data.length
      : 0;
  const normalized = normalizeDefiLlamaPools(payload);
  const selection = selectCatalogPools(normalized, filters);
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    source: {
      id: "defillama-yields",
      name: "DefiLlama Yields",
      url: getSourceUrl(),
      revalidateSeconds: CATALOG_REVALIDATE_SECONDS,
    },
    methodology: {
      chains: CATALOG_CHAINS,
      projects: DEX_PROJECTS,
      minimumTvlUsd: CATALOG_MINIMUM_TVL_USD,
      maximumPoolsPerChain: CATALOG_MAXIMUM_POOLS_PER_CHAIN,
      excludesOutliers: true,
      ranking:
        "TVL décroissante dans chaque chaîne, quota par chaîne, puis tri TVL global.",
      caveats: [
        "Les APY et volumes sont fournis par les adaptateurs DefiLlama et peuvent être nuls.",
        "Le catalogue ne constitue ni un audit de sécurité ni une recommandation d'investissement.",
        "Seuls les DEX directs explicitement autorisés sont conservés.",
      ],
    },
    filters: {
      id: filters.id?.trim() || null,
      chain: filters.chain ?? null,
      project: filters.project ?? null,
    },
    stats: {
      sourceRows,
      normalizedRows: normalized.length,
      eligibleRows: selection.eligibleCount,
      matchedRows: selection.matchedCount,
      returnedRows: selection.pools.length,
      returnedByChain: selection.selectedByChain,
    },
    pools: selection.pools,
  };
}
