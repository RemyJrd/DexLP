import { getAddress } from "viem";

export const POOL_CONFIG = {
  chain: {
    id: 100,
    name: "Gnosis Chain",
    nativeCurrency: "xDAI",
  },
  protocol: {
    name: "SushiSwap",
    version: "V2",
    feePct: 0.3,
  },
  pair: {
    address: getAddress("0xA227c72a4055A9DC949cAE24f54535fe890d3663"),
    symbol: "USDC / WXDAI",
  },
  factory: getAddress("0xC35DAdb65012eC5796536bD9864eD8773aBc74C4"),
  tokens: [
    {
      address: getAddress("0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"),
      symbol: "USDC",
      name: "USD//C on xDai",
      decimals: 6,
      color: "#77e6be",
    },
    {
      address: getAddress("0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"),
      symbol: "WXDAI",
      name: "Wrapped xDAI",
      decimals: 18,
      color: "#7aa7ff",
    },
  ] as const,
  urls: {
    explorer: "https://gnosis.blockscout.com",
    sushi:
      "https://www.sushi.com/gnosis/pool/v2/0xA227c72a4055A9DC949cAE24f54535fe890d3663",
  },
  refreshMs: 30_000,
} as const;

export function getServerDataConfig() {
  return {
    rpcUrl: process.env.GNOSIS_RPC_URL ?? "https://rpc.gnosischain.com",
    rpcFallbackUrl:
      process.env.GNOSIS_RPC_FALLBACK_URL ?? "https://rpc.gnosis.gateway.fm",
    blockscoutApiUrl:
      process.env.BLOCKSCOUT_API_URL ??
      "https://gnosis.blockscout.com/api/v2",
  };
}

