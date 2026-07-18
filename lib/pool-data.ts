import "server-only";

import {
  createPublicClient,
  fallback,
  getAddress,
  http,
  type Address,
} from "viem";
import { gnosis } from "viem/chains";
import { sushiV2PairAbi } from "./abis";
import { getServerDataConfig, POOL_CONFIG } from "./pool-config";
import {
  mapPairReserves,
  proportionalReserve,
  rawToNumber,
  shareOfSupply,
  stablePoolMetrics,
} from "./pool-math";
import type {
  HolderSnapshot,
  HoldersSnapshot,
  PoolSnapshot,
} from "./pool-types";

interface BlockscoutAddress {
  hash?: unknown;
  is_contract?: unknown;
  name?: unknown;
  ens_domain_name?: unknown;
  metadata?: unknown;
  public_tags?: unknown;
}

interface RawHolder {
  value: string;
  address: BlockscoutAddress;
}

interface HolderSourceData {
  items: RawHolder[];
  count: number | null;
}

let holderCache:
  | {
      expiresAt: number;
      data: HolderSourceData;
    }
  | undefined;

function createGnosisClient() {
  const { rpcUrl, rpcFallbackUrl } = getServerDataConfig();

  return createPublicClient({
    chain: gnosis,
    transport: fallback(
      [
        http(rpcUrl, { retryCount: 1, timeout: 8_000 }),
        http(rpcFallbackUrl, { retryCount: 1, timeout: 8_000 }),
      ],
      { rank: false },
    ),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function addressLabel(address: BlockscoutAddress): string | null {
  if (isRecord(address.metadata)) {
    const metadataName = optionalString(address.metadata.name);
    if (metadataName) return metadataName;
  }

  const contractName = optionalString(address.name);
  if (contractName) return contractName;

  const ensName = optionalString(address.ens_domain_name);
  if (ensName) return ensName;

  if (Array.isArray(address.public_tags)) {
    for (const tag of address.public_tags) {
      if (!isRecord(tag)) continue;
      const displayName =
        optionalString(tag.display_name) ?? optionalString(tag.label);
      if (displayName) return displayName;
    }
  }

  return null;
}

function parseRawHolders(payload: unknown): RawHolder[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error("Réponse holders Blockscout invalide.");
  }

  const parsed: RawHolder[] = [];

  for (const item of payload.items) {
    if (!isRecord(item) || typeof item.value !== "string") continue;

    const addressCandidate = isRecord(item.address)
      ? item.address
      : isRecord(item.address_hash)
        ? item.address_hash
        : null;

    if (!addressCandidate || typeof addressCandidate.hash !== "string") {
      continue;
    }

    try {
      BigInt(item.value);
      getAddress(addressCandidate.hash);
    } catch {
      continue;
    }

    parsed.push({
      value: item.value,
      address: addressCandidate,
    });
  }

  return parsed.sort((left, right) => {
    const leftValue = BigInt(left.value);
    const rightValue = BigInt(right.value);
    return leftValue === rightValue ? 0 : leftValue > rightValue ? -1 : 1;
  });
}

function parseHolderCount(payload: unknown): number | null {
  if (!isRecord(payload)) return null;

  const rawCount = payload.holders_count;
  const parsed =
    typeof rawCount === "string" || typeof rawCount === "number"
      ? Number(rawCount)
      : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 300,
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Blockscout HTTP ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function fetchHolderSourceData(): Promise<HolderSourceData> {
  if (holderCache && holderCache.expiresAt > Date.now()) {
    return holderCache.data;
  }

  const { blockscoutApiUrl } = getServerDataConfig();
  const baseUrl = blockscoutApiUrl.replace(/\/$/, "");
  const encodedPair = encodeURIComponent(POOL_CONFIG.pair.address);
  const [holdersResult, tokenResult] = await Promise.allSettled([
    fetchJson(`${baseUrl}/tokens/${encodedPair}/holders`),
    fetchJson(`${baseUrl}/tokens/${encodedPair}`),
  ]);

  if (holdersResult.status === "rejected") {
    throw holdersResult.reason;
  }

  const data = {
    items: parseRawHolders(holdersResult.value),
    count:
      tokenResult.status === "fulfilled"
        ? parseHolderCount(tokenResult.value)
        : null,
  };

  holderCache = {
    expiresAt: Date.now() + 5 * 60_000,
    data,
  };

  return data;
}

function normalizeHolders(
  source: HolderSourceData,
  totalSupply: bigint,
  rawReserves: readonly bigint[],
): HoldersSnapshot {
  const items: HolderSnapshot[] = source.items.slice(0, 10).map((holder, index) => {
    const balanceRaw = BigInt(holder.value);
    const address = getAddress(String(holder.address.hash));

    return {
      rank: index + 1,
      address,
      label: addressLabel(holder.address),
      addressType:
        holder.address.is_contract === true ? "contract" : "wallet",
      balance: rawToNumber(balanceRaw, 18),
      balanceRaw: balanceRaw.toString(),
      sharePct: shareOfSupply(balanceRaw, totalSupply),
      underlying: POOL_CONFIG.tokens.map((token, tokenIndex) => ({
        symbol: token.symbol,
        amount: rawToNumber(
          proportionalReserve(
            rawReserves[tokenIndex] ?? 0n,
            balanceRaw,
            totalSupply,
          ),
          token.decimals,
        ),
      })),
    };
  });

  return {
    status: "live",
    count: source.count,
    topOnePct: items[0]?.sharePct ?? 0,
    topTenPct: items.reduce((sum, holder) => sum + holder.sharePct, 0),
    items,
    error: null,
  };
}

async function getHolders(
  totalSupply: bigint,
  rawReserves: readonly bigint[],
): Promise<HoldersSnapshot> {
  try {
    const source = await fetchHolderSourceData();
    return normalizeHolders(source, totalSupply, rawReserves);
  } catch (error) {
    console.error("Blockscout holders unavailable", error);
    return {
      status: "unavailable",
      count: null,
      topOnePct: null,
      topTenPct: null,
      items: [],
      error:
        "Blockscout ne répond pas pour le moment. Les réserves on-chain restent disponibles.",
    };
  }
}

export async function getPoolSnapshot(): Promise<PoolSnapshot> {
  const client = createGnosisClient();
  const pairAddress = POOL_CONFIG.pair.address as Address;
  const contracts = [
    {
      address: pairAddress,
      abi: sushiV2PairAbi,
      functionName: "getReserves",
    },
    {
      address: pairAddress,
      abi: sushiV2PairAbi,
      functionName: "token0",
    },
    {
      address: pairAddress,
      abi: sushiV2PairAbi,
      functionName: "token1",
    },
    {
      address: pairAddress,
      abi: sushiV2PairAbi,
      functionName: "totalSupply",
    },
  ] as const;

  const [contractResults, block] = await Promise.all([
    client.multicall({
      contracts,
      allowFailure: false,
    }),
    client.getBlock(),
  ]);

  const reserves = contractResults[0];
  const token0 = contractResults[1];
  const token1 = contractResults[2];
  const totalSupply = contractResults[3];
  const rawReserves = mapPairReserves(
    token0,
    token1,
    reserves[0],
    reserves[1],
    POOL_CONFIG.tokens,
  ).map((reserve) => reserve.value);
  const formattedReserves = POOL_CONFIG.tokens.map((token, index) =>
    rawToNumber(rawReserves[index] ?? 0n, token.decimals),
  );
  const metrics = stablePoolMetrics(
    formattedReserves[0] ?? 0,
    formattedReserves[1] ?? 0,
  );
  const holders = await getHolders(totalSupply, rawReserves);
  const { rpcUrl } = getServerDataConfig();

  return {
    generatedAt: new Date().toISOString(),
    block: {
      number: Number(block.number),
      timestamp: new Date(Number(block.timestamp) * 1_000).toISOString(),
    },
    network: POOL_CONFIG.chain,
    protocol: POOL_CONFIG.protocol,
    pool: {
      address: POOL_CONFIG.pair.address,
      symbol: POOL_CONFIG.pair.symbol,
      factory: POOL_CONFIG.factory,
      explorerUrl: `${POOL_CONFIG.urls.explorer}/address/${POOL_CONFIG.pair.address}`,
      sushiUrl: POOL_CONFIG.urls.sushi,
    },
    metrics: {
      estimatedTvlUsd: metrics.estimatedTvlUsd,
      priceUsdcInWxdai: metrics.priceUsdcInWxdai,
      pegDeviationPct: metrics.pegDeviationPct,
      totalSupply: rawToNumber(totalSupply, 18),
      totalSupplyRaw: totalSupply.toString(),
    },
    tokens: POOL_CONFIG.tokens.map((token, index) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      color: token.color,
      reserve: formattedReserves[index] ?? 0,
      reserveRaw: (rawReserves[index] ?? 0n).toString(),
      estimatedValueUsd: formattedReserves[index] ?? 0,
      weightPct: metrics.weights[index] ?? 0,
    })),
    holders,
    methodology:
      "TVL estimée en supposant 1 USDC = 1 USD et 1 WXDAI = 1 USD. Les détenteurs sont les holders directs du jeton LP ; un contrat peut agréger plusieurs bénéficiaires.",
    sources: {
      rpc: new URL(rpcUrl).hostname,
      holders: "Gnosis Blockscout API v2",
    },
  };
}

