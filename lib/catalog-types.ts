export const CATALOG_CHAINS = [
  "Gnosis",
  "Ethereum",
  "Arbitrum",
  "Base",
  "Polygon",
  "OP Mainnet",
] as const;

export type CatalogChain = (typeof CATALOG_CHAINS)[number];

export const CATALOG_CHAIN_LABELS = {
  Gnosis: "Gnosis",
  Ethereum: "Ethereum",
  Arbitrum: "Arbitrum",
  Base: "Base",
  Polygon: "Polygon",
  "OP Mainnet": "Optimism",
} as const satisfies Record<CatalogChain, string>;

export const DEX_PROJECTS = [
  "curve-dex",
  "uniswap-v2",
  "uniswap-v3",
  "uniswap-v4",
  "sushiswap",
  "sushiswap-v3",
  "balancer-v2",
  "balancer-v3",
  "aerodrome-v1",
  "aerodrome-slipstream",
  "pancakeswap-amm",
  "pancakeswap-amm-v3",
  "quickswap-dex",
  "camelot-v2",
  "camelot-v3",
  "fluid-dex",
] as const;

export type DexProject = (typeof DEX_PROJECTS)[number];

export const DEX_PROJECT_LABELS = {
  "curve-dex": "Curve",
  "uniswap-v2": "Uniswap V2",
  "uniswap-v3": "Uniswap V3",
  "uniswap-v4": "Uniswap V4",
  sushiswap: "SushiSwap",
  "sushiswap-v3": "SushiSwap V3",
  "balancer-v2": "Balancer V2",
  "balancer-v3": "Balancer V3",
  "aerodrome-v1": "Aerodrome",
  "aerodrome-slipstream": "Aerodrome Slipstream",
  "pancakeswap-amm": "PancakeSwap",
  "pancakeswap-amm-v3": "PancakeSwap V3",
  "quickswap-dex": "QuickSwap",
  "camelot-v2": "Camelot V2",
  "camelot-v3": "Camelot V3",
  "fluid-dex": "Fluid DEX",
} as const satisfies Record<DexProject, string>;

const CHAIN_BY_KEY = new Map(
  CATALOG_CHAINS.map((chain) => [chain.toLowerCase(), chain]),
);

const PROJECT_BY_KEY = new Map(
  DEX_PROJECTS.map((project) => [project.toLowerCase(), project]),
);

export function asCatalogChain(value: string): CatalogChain | null {
  return CHAIN_BY_KEY.get(value.trim().toLowerCase()) ?? null;
}

export function asDexProject(value: string): DexProject | null {
  return PROJECT_BY_KEY.get(value.trim().toLowerCase()) ?? null;
}

export interface CatalogPool {
  id: string;
  chain: CatalogChain;
  project: DexProject;
  protocolName: string;
  symbol: string;
  tvlUsd: number | null;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d: number | null;
  apyPct7D: number | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  underlyingTokens: string[];
  rewardTokens: string[];
  stablecoin: boolean | null;
  ilRisk: "yes" | "no" | null;
  exposure: "single" | "multi" | null;
  poolMeta: string | null;
  outlier: boolean | null;
  sourceUrl: string;
}

export interface CatalogFilters {
  id?: string;
  chain?: CatalogChain;
  project?: DexProject;
}

export interface CatalogSelection {
  pools: CatalogPool[];
  eligibleCount: number;
  matchedCount: number;
  selectedByChain: Record<CatalogChain, number>;
}

export interface PoolCatalogResponse {
  generatedAt: string;
  source: {
    id: "defillama-yields";
    name: "DefiLlama Yields";
    url: string;
    revalidateSeconds: number;
  };
  methodology: {
    chains: readonly CatalogChain[];
    projects: readonly DexProject[];
    minimumTvlUsd: number;
    maximumPoolsPerChain: number;
    excludesOutliers: true;
    ranking: string;
    caveats: string[];
  };
  filters: {
    id: string | null;
    chain: CatalogChain | null;
    project: DexProject | null;
  };
  stats: {
    sourceRows: number;
    normalizedRows: number;
    eligibleRows: number;
    matchedRows: number;
    returnedRows: number;
    returnedByChain: Record<CatalogChain, number>;
  };
  pools: CatalogPool[];
}

export interface CatalogApiError {
  error: {
    code: string;
    message: string;
  };
}
