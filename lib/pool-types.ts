export type AddressType = "wallet" | "contract";

export interface PoolTokenSnapshot {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  reserve: number;
  reserveRaw: string;
  estimatedValueUsd: number;
  weightPct: number;
}

export interface HolderSnapshot {
  rank: number;
  address: string;
  label: string | null;
  addressType: AddressType;
  balance: number;
  balanceRaw: string;
  sharePct: number;
  underlying: Array<{
    symbol: string;
    amount: number;
  }>;
}

export interface HoldersSnapshot {
  status: "live" | "unavailable";
  count: number | null;
  topOnePct: number | null;
  topTenPct: number | null;
  items: HolderSnapshot[];
  error: string | null;
}

export interface PoolSnapshot {
  generatedAt: string;
  block: {
    number: number;
    timestamp: string;
  };
  network: {
    id: number;
    name: string;
    nativeCurrency: string;
  };
  protocol: {
    name: string;
    version: string;
    feePct: number;
  };
  pool: {
    address: string;
    symbol: string;
    factory: string;
    explorerUrl: string;
    sushiUrl: string;
  };
  metrics: {
    estimatedTvlUsd: number;
    priceUsdcInWxdai: number;
    pegDeviationPct: number;
    totalSupply: number;
    totalSupplyRaw: string;
  };
  tokens: PoolTokenSnapshot[];
  holders: HoldersSnapshot;
  methodology: string;
  sources: {
    rpc: string;
    holders: string;
  };
}

export interface PoolApiError {
  error: {
    code: string;
    message: string;
  };
}

