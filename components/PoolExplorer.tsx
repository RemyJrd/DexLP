"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CATALOG_CHAIN_LABELS,
  CATALOG_CHAINS,
  DEX_PROJECT_LABELS,
  DEX_PROJECTS,
  type CatalogChain,
  type CatalogPool,
  type DexProject,
  type PoolCatalogResponse,
} from "../lib/catalog-types";
import type { PoolApiError, PoolSnapshot } from "../lib/pool-types";
import {
  ActivityIcon,
  AlertIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  LayersIcon,
  RefreshIcon,
  ShieldIcon,
} from "./Icons";

const FEATURED_POOL_ADDRESS =
  "0xA227c72a4055A9DC949cAE24f54535fe890d3663";
const FEATURED_POOL_PATH = "/pools/gnosis/sushi-v2/usdc-wxdai";
const PAGE_SIZE = 30;

type StableFilter = "all" | "stable" | "volatile";
type SortKey = "tvl" | "volume" | "apy" | "name";
type Coverage = "detailed" | "summary";

interface ExplorerPool extends CatalogPool {
  coverage: Coverage;
  detailHref: string;
  featured: boolean;
  liveOnchain: boolean;
}

const compactCurrency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const fullCurrency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCatalogResponse(value: unknown): value is PoolCatalogResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.pools) &&
    isRecord(value.stats) &&
    typeof value.generatedAt === "string"
  );
}

function isPoolSnapshot(value: unknown): value is PoolSnapshot {
  return (
    isRecord(value) &&
    isRecord(value.pool) &&
    isRecord(value.metrics) &&
    Array.isArray(value.tokens)
  );
}

function makeFeaturedPool(snapshot: PoolSnapshot | null): ExplorerPool {
  return {
    id: FEATURED_POOL_ADDRESS,
    chain: "Gnosis",
    project: "sushiswap",
    protocolName: "SushiSwap V2",
    symbol: "USDC-WXDAI",
    tvlUsd: snapshot?.metrics.estimatedTvlUsd ?? null,
    apy: null,
    apyBase: null,
    apyReward: null,
    apyMean30d: null,
    apyPct7D: null,
    volumeUsd1d: null,
    volumeUsd7d: null,
    underlyingTokens:
      snapshot?.tokens.map((token) => token.address) ?? [
        "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
        "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      ],
    rewardTokens: [],
    stablecoin: true,
    ilRisk: null,
    exposure: "multi",
    poolMeta: "V2 · 0,30 % de frais",
    outlier: false,
    sourceUrl: `https://gnosis.blockscout.com/address/${FEATURED_POOL_ADDRESS}`,
    coverage: "detailed",
    detailHref: FEATURED_POOL_PATH,
    featured: true,
    liveOnchain: snapshot !== null,
  };
}

function makeCatalogPool(pool: CatalogPool): ExplorerPool {
  return {
    ...pool,
    coverage: "summary",
    detailHref: `/pools/${encodeURIComponent(pool.id)}`,
    featured: false,
    liveOnchain: false,
  };
}

function formatCurrency(value: number | null) {
  return value === null ? "—" : compactCurrency.format(value);
}

function formatApy(value: number | null, digits = 2) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) return "< 0,01 %";

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

function formatDelta(value: number | null) {
  if (value === null) return null;
  if (Math.abs(value) < 0.005) return "0 pp";

  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value)} pp`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shorten(value: string, head = 8, tail = 6) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function poolTokens(symbol: string) {
  const tokens = symbol
    .split(/[-/]/)
    .map((token) => token.trim())
    .filter(Boolean);

  return (tokens.length > 0 ? tokens : [symbol]).slice(0, 3);
}

function nullableDescending(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

function comparePools(left: ExplorerPool, right: ExplorerPool, sort: SortKey) {
  if (left.featured !== right.featured) return left.featured ? -1 : 1;

  if (sort === "name") {
    return (
      left.symbol.localeCompare(right.symbol, "fr") ||
      nullableDescending(left.tvlUsd, right.tvlUsd)
    );
  }

  const metric =
    sort === "apy" ? "apy" : sort === "volume" ? "volumeUsd1d" : "tvlUsd";
  const byMetric = nullableDescending(left[metric], right[metric]);

  return (
    byMetric ||
    left.symbol.localeCompare(right.symbol, "fr") ||
    left.id.localeCompare(right.id)
  );
}

function matchesQuery(pool: ExplorerPool, query: string) {
  const normalized = query.trim().toLocaleLowerCase("fr");
  if (!normalized) return true;

  return [
    pool.symbol,
    pool.chain,
    CATALOG_CHAIN_LABELS[pool.chain],
    pool.project,
    pool.protocolName,
    pool.poolMeta,
    pool.id,
    ...pool.underlyingTokens,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("fr")
    .includes(normalized);
}

function PoolMarks({ symbol }: { symbol: string }) {
  const tokens = poolTokens(symbol);

  return (
    <span className="flex shrink-0 -space-x-2" aria-hidden="true">
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className={`pool-token-mark pool-token-mark-${(index % 3) + 1}`}
        >
          {token.slice(0, 2)}
        </span>
      ))}
    </span>
  );
}

function PoolIdentity({ pool }: { pool: ExplorerPool }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PoolMarks symbol={pool.symbol} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={pool.detailHref}
            className="truncate text-sm font-semibold text-white transition hover:text-accent"
          >
            {pool.symbol.replaceAll("-", " / ")}
          </Link>
          {pool.featured && <span className="featured-pill">Pool pilote</span>}
        </div>
        <p className="mt-1 truncate text-[10px] text-ink-muted">
          {pool.featured
            ? shorten(pool.id, 10, 8)
            : pool.poolMeta ?? shorten(pool.id)}
        </p>
      </div>
    </div>
  );
}

function YieldBreakdown({ pool }: { pool: ExplorerPool }) {
  const delta = formatDelta(pool.apyPct7D);

  return (
    <div>
      <p className="font-mono text-sm font-semibold tabular-nums text-white">
        {formatApy(pool.apy)}
      </p>
      {pool.apy === null ? (
        <p className="mt-1 text-[10px] text-ink-muted">
          APY non disponible
        </p>
      ) : (
        <>
          <p className="mt-1 whitespace-nowrap text-[10px] text-ink-muted">
            Base {formatApy(pool.apyBase)} · Rewards{" "}
            {formatApy(pool.apyReward)}
          </p>
          {delta && (
            <p
              className={`mt-1 text-[10px] ${
                (pool.apyPct7D ?? 0) < 0 ? "text-rose-300" : "text-accent"
              }`}
            >
              Δ APY 7 j {delta}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PoolRisk({ pool }: { pool: ExplorerPool }) {
  const type =
    pool.stablecoin === null
      ? "Type non publié"
      : pool.stablecoin
        ? "Stable"
        : "Volatile";

  return (
    <div className="space-y-1.5">
      <span className="risk-pill">{type}</span>
      {pool.ilRisk !== null && (
        <p className="text-[10px] text-ink-muted">
          IL signalée : {pool.ilRisk === "yes" ? "oui" : "non"}
        </p>
      )}
    </div>
  );
}

function CoverageBadge({ pool }: { pool: ExplorerPool }) {
  return (
    <span
      className={`coverage-pill ${
        pool.coverage === "detailed"
          ? "coverage-pill-detailed"
          : "coverage-pill-summary"
      }`}
    >
      {pool.coverage === "detailed"
        ? pool.liveOnchain
          ? "Analyse complète · live"
          : "Analyse complète"
        : "Fiche synthétique"}
    </span>
  );
}

function DesktopResults({ pools }: { pools: ExplorerPool[] }) {
  return (
    <div className="hidden overflow-hidden xl:block">
      <table className="catalog-table">
        <caption className="sr-only">
          Pools de liquidité comparées par réseau, TVL, volume et APY
        </caption>
        <thead>
          <tr>
            <th scope="col">Pool</th>
            <th scope="col">Réseau</th>
            <th scope="col">Protocole</th>
            <th scope="col" className="text-right">
              TVL
            </th>
            <th scope="col" className="text-right">
              Volume 24 h
            </th>
            <th scope="col">APY publié</th>
            <th scope="col">Profil</th>
            <th scope="col">Couverture</th>
            <th scope="col" aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => (
            <tr key={`${pool.featured ? "featured" : "catalog"}-${pool.id}`}>
              <td className="max-w-[260px]">
                <PoolIdentity pool={pool} />
              </td>
              <td>
                <span className="chain-label">
                  <span className="chain-mark">
                    {CATALOG_CHAIN_LABELS[pool.chain].slice(0, 1)}
                  </span>
                  {CATALOG_CHAIN_LABELS[pool.chain]}
                </span>
              </td>
              <td>
                <p className="text-xs font-medium text-white">
                  {pool.protocolName}
                </p>
                <p className="mt-1 text-[10px] text-ink-muted">
                  {pool.poolMeta ?? pool.project}
                </p>
              </td>
              <td className="text-right">
                <p
                  className="font-mono text-sm tabular-nums text-white"
                  aria-label={
                    pool.tvlUsd === null
                      ? "TVL indisponible"
                      : fullCurrency.format(pool.tvlUsd)
                  }
                >
                  {formatCurrency(pool.tvlUsd)}
                </p>
              </td>
              <td className="text-right">
                <p
                  className="font-mono text-sm tabular-nums text-white"
                  aria-label={
                    pool.volumeUsd1d === null
                      ? "Volume 24 heures indisponible"
                      : fullCurrency.format(pool.volumeUsd1d)
                  }
                >
                  {formatCurrency(pool.volumeUsd1d)}
                </p>
              </td>
              <td>
                <YieldBreakdown pool={pool} />
              </td>
              <td>
                <PoolRisk pool={pool} />
              </td>
              <td>
                <div className="space-y-2">
                  <CoverageBadge pool={pool} />
                  <a
                    href={pool.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-fit items-center gap-1 text-[10px] text-ink-muted transition hover:text-white"
                  >
                    {pool.featured ? "Blockscout" : "DefiLlama"}
                    <ExternalLinkIcon className="h-3 w-3" />
                    <span className="sr-only">, ouvre un nouvel onglet</span>
                  </a>
                </div>
              </td>
              <td className="text-right">
                <Link href={pool.detailHref} className="secondary-button">
                  {pool.coverage === "detailed" ? "Analyser" : "Voir la fiche"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileResults({ pools }: { pools: ExplorerPool[] }) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:hidden">
      {pools.map((pool) => (
        <article
          key={`${pool.featured ? "featured" : "catalog"}-${pool.id}`}
          className="catalog-pool-card"
        >
          <div className="flex items-start justify-between gap-3">
            <PoolIdentity pool={pool} />
            <span className="chain-mark shrink-0">
              {CATALOG_CHAIN_LABELS[pool.chain].slice(0, 1)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="subtle-pill">{pool.protocolName}</span>
            <PoolRisk pool={pool} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <dt className="eyebrow">TVL</dt>
              <dd className="mt-2 font-mono text-base text-white">
                {formatCurrency(pool.tvlUsd)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Volume 24 h</dt>
              <dd className="mt-2 font-mono text-base text-white">
                {formatCurrency(pool.volumeUsd1d)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="eyebrow">APY publié · DefiLlama</dt>
              <dd className="mt-2">
                <YieldBreakdown pool={pool} />
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <CoverageBadge pool={pool} />
            <Link href={pool.detailHref} className="secondary-button">
              {pool.coverage === "detailed" ? "Analyser" : "Voir la fiche"}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div
      className="space-y-px p-4 sm:p-5"
      aria-label="Chargement des pools"
      aria-busy="true"
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-20 grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-6 border-b border-white/[0.05] px-2 py-4 last:border-0"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-16 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-40 max-w-full" />
              <div className="mt-2 skeleton h-3 w-24" />
            </div>
          </div>
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
      <span className="sr-only">Chargement des pools de liquidité.</span>
    </div>
  );
}

export function PoolExplorer() {
  const [catalog, setCatalog] = useState<PoolCatalogResponse | null>(null);
  const [featuredSnapshot, setFeaturedSnapshot] =
    useState<PoolSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<CatalogChain | "">("");
  const [project, setProject] = useState<DexProject | "">("");
  const [stableFilter, setStableFilter] =
    useState<StableFilter>("all");
  const [sort, setSort] = useState<SortKey>("tvl");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRefreshing(true);

    const [catalogResult, featuredResult] = await Promise.allSettled([
      fetch("/api/pools", {
        cache: "no-store",
        signal: controller.signal,
      }).then(async (response) => {
        const payload = (await response.json()) as unknown;
        if (!response.ok || !isCatalogResponse(payload)) {
          const message =
            isRecord(payload) &&
            isRecord(payload.error) &&
            typeof payload.error.message === "string"
              ? payload.error.message
              : "Réponse catalogue inattendue.";
          throw new Error(message);
        }
        return payload;
      }),
      fetch("/api/pool", {
        cache: "no-store",
        signal: controller.signal,
      }).then(async (response) => {
        const payload = (await response.json()) as
          | PoolSnapshot
          | PoolApiError;
        if (!response.ok || !isPoolSnapshot(payload)) return null;
        return payload;
      }),
    ]);

    if (controller.signal.aborted) return;

    if (catalogResult.status === "fulfilled") {
      setCatalog(catalogResult.value);
      setError(null);
    } else {
      setError(
        catalogResult.reason instanceof Error
          ? catalogResult.reason.message
          : "Le catalogue multi-chain est indisponible.",
      );
    }

    if (featuredResult.status === "fulfilled") {
      setFeaturedSnapshot(featuredResult.value);
    }

    if (activeRequest.current === controller) {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(initialTimer);
      activeRequest.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    function applyUrlFilters() {
      const params = new URLSearchParams(window.location.search);
      const nextChain = params.get("chain");
      const nextProject = params.get("protocol");
      const nextType = params.get("type");
      const nextSort = params.get("sort");

      setQuery(params.get("q") ?? "");
      setChain(
        CATALOG_CHAINS.includes(nextChain as CatalogChain)
          ? (nextChain as CatalogChain)
          : "",
      );
      setProject(
        DEX_PROJECTS.includes(nextProject as DexProject)
          ? (nextProject as DexProject)
          : "",
      );
      setStableFilter(
        nextType === "stable" || nextType === "volatile" ? nextType : "all",
      );
      setSort(
        nextSort === "volume" || nextSort === "apy" || nextSort === "name"
          ? nextSort
          : "tvl",
      );
      setVisibleCount(PAGE_SIZE);
    }

    applyUrlFilters();
    window.addEventListener("popstate", applyUrlFilters);
    return () => window.removeEventListener("popstate", applyUrlFilters);
  }, []);

  const updateUrl = useCallback(
    (next: {
      query?: string;
      chain?: CatalogChain | "";
      project?: DexProject | "";
      stableFilter?: StableFilter;
      sort?: SortKey;
    }) => {
      const values = {
        query: next.query ?? query,
        chain: next.chain ?? chain,
        project: next.project ?? project,
        stableFilter: next.stableFilter ?? stableFilter,
        sort: next.sort ?? sort,
      };
      const params = new URLSearchParams();

      if (values.query.trim()) params.set("q", values.query.trim());
      if (values.chain) params.set("chain", values.chain);
      if (values.project) params.set("protocol", values.project);
      if (values.stableFilter !== "all") {
        params.set("type", values.stableFilter);
      }
      if (values.sort !== "tvl") params.set("sort", values.sort);

      const nextUrl = params.size > 0 ? `?${params.toString()}` : "/";
      window.history.replaceState(null, "", nextUrl);
    },
    [chain, project, query, sort, stableFilter],
  );

  const catalogPools = useMemo(
    () => catalog?.pools.map(makeCatalogPool) ?? [],
    [catalog],
  );
  const featured = useMemo(
    () => makeFeaturedPool(featuredSnapshot),
    [featuredSnapshot],
  );

  const filteredPools = useMemo(() => {
    const pools = [featured, ...catalogPools].filter((pool) => {
      if (!matchesQuery(pool, query)) return false;
      if (chain && pool.chain !== chain) return false;
      if (project && pool.project !== project) return false;
      if (stableFilter === "stable" && pool.stablecoin !== true) return false;
      if (stableFilter === "volatile" && pool.stablecoin !== false) return false;
      return true;
    });

    return pools.sort((left, right) => comparePools(left, right, sort));
  }, [catalogPools, chain, featured, project, query, sort, stableFilter]);

  const availableProjects = useMemo(() => {
    const projects = new Set(catalogPools.map((pool) => pool.project));
    projects.add("sushiswap");
    return DEX_PROJECTS.filter((candidate) => projects.has(candidate));
  }, [catalogPools]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setChain("");
    setProject("");
    setStableFilter("all");
    setSort("tvl");
    setVisibleCount(PAGE_SIZE);
    window.history.replaceState(null, "", "/");
  }, []);

  const hasFilters =
    query.trim().length > 0 ||
    chain !== "" ||
    project !== "" ||
    stableFilter !== "all" ||
    sort !== "tvl";
  const visiblePools = filteredPools.slice(0, visibleCount);
  const protocolCount = new Set(catalogPools.map((pool) => pool.project)).size;
  const chainCount = catalog?.methodology.chains.length ?? CATALOG_CHAINS.length;

  return (
    <div className="space-y-6">
      <section className="catalog-hero">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill">
              <span className="status-dot" />
              Catalogue multi-chain
            </span>
            <span className="subtle-pill">Lecture seule</span>
          </div>
          <p className="eyebrow mt-7 text-accent">Explorateur de liquidité</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Comparer les pools,
            <span className="text-gradient"> réseau par réseau.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">
            TVL, volume et APY publié pour les principaux DEX EVM, avec une
            analyse on-chain approfondie de la pool pilote Gnosis.
          </p>
        </div>

        <dl className="catalog-kpis" aria-label="Couverture du catalogue">
          <div>
            <dt>Pools publiées</dt>
            <dd>
              {catalog ? integer.format(catalog.stats.returnedRows + 1) : "—"}
            </dd>
          </div>
          <div>
            <dt>Réseaux</dt>
            <dd>{integer.format(chainCount)}</dd>
          </div>
          <div>
            <dt>Protocoles</dt>
            <dd>{catalog ? integer.format(protocolCount) : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel p-4 sm:p-5" aria-label="Filtres du catalogue">
        <div className="catalog-filters">
          <label className="catalog-field catalog-search-field">
            <span className="catalog-label">Recherche</span>
            <input
              type="search"
              data-testid="pool-search"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setVisibleCount(PAGE_SIZE);
                updateUrl({ query: value });
              }}
              className="catalog-input"
              placeholder="Token, pool, protocole ou adresse…"
            />
          </label>

          <label className="catalog-field">
            <span className="catalog-label">Réseau</span>
            <select
              data-testid="chain-filter"
              value={chain}
              onChange={(event) => {
                const value = event.target.value as CatalogChain | "";
                setChain(value);
                setVisibleCount(PAGE_SIZE);
                updateUrl({ chain: value });
              }}
              className="catalog-select"
            >
              <option value="">Tous les réseaux</option>
              {CATALOG_CHAINS.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {CATALOG_CHAIN_LABELS[candidate]}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-field">
            <span className="catalog-label">Protocole</span>
            <select
              data-testid="protocol-filter"
              value={project}
              onChange={(event) => {
                const value = event.target.value as DexProject | "";
                setProject(value);
                setVisibleCount(PAGE_SIZE);
                updateUrl({ project: value });
              }}
              className="catalog-select"
            >
              <option value="">Tous les protocoles</option>
              {availableProjects.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {DEX_PROJECT_LABELS[candidate]}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-field">
            <span className="catalog-label">Profil</span>
            <select
              data-testid="profile-filter"
              value={stableFilter}
              onChange={(event) => {
                const value = event.target.value as StableFilter;
                setStableFilter(value);
                setVisibleCount(PAGE_SIZE);
                updateUrl({ stableFilter: value });
              }}
              className="catalog-select"
            >
              <option value="all">Tous les profils</option>
              <option value="stable">Stable</option>
              <option value="volatile">Volatile</option>
            </select>
          </label>

          <label className="catalog-field">
            <span className="catalog-label">Trier par</span>
            <select
              data-testid="sort-filter"
              value={sort}
              onChange={(event) => {
                const value = event.target.value as SortKey;
                setSort(value);
                setVisibleCount(PAGE_SIZE);
                updateUrl({ sort: value });
              }}
              className="catalog-select"
            >
              <option value="tvl">TVL décroissante</option>
              <option value="volume">Volume 24 h</option>
              <option value="apy">APY publié</option>
              <option value="name">Nom A–Z</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <p className="text-xs text-ink-muted" aria-live="polite">
            {integer.format(filteredPools.length)} pool
            {filteredPools.length > 1 ? "s" : ""} affichée
            {filteredPools.length > 1 ? "s" : ""}
            {catalog?.generatedAt && (
              <>
                {" "}
                · synchronisé le{" "}
                <time dateTime={catalog.generatedAt}>
                  {formatDate(catalog.generatedAt)}
                </time>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-button"
              >
                Réinitialiser
              </button>
            )}
            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              className="secondary-button"
            >
              <RefreshIcon
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div
          className="inline-alert inline-alert-warning"
          role={catalog ? "status" : "alert"}
        >
          <AlertIcon className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-100">
              Catalogue agrégé temporairement indisponible
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-100/65">
              {error} La pool pilote Gnosis reste accessible avec sa source
              on-chain indépendante.
            </p>
          </div>
          <button type="button" onClick={load} className="text-button">
            Réessayer
          </button>
        </div>
      )}

      <section className="panel overflow-hidden" aria-labelledby="pool-results">
        <div className="panel-heading border-b border-white/[0.06]">
          <div>
            <p className="eyebrow">Marchés suivis</p>
            <h2 id="pool-results" className="section-title">
              Pools de liquidité
            </h2>
            <p className="section-description">
              La pool pilote est épinglée ; les autres résultats suivent le tri
              sélectionné.
            </p>
          </div>
          <span className="source-pill">
            <DatabaseIcon className="h-3.5 w-3.5" />
            {catalog?.source.name ?? "DefiLlama Yields"}
          </span>
        </div>

        {!catalog && !error ? (
          <ResultsSkeleton />
        ) : filteredPools.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-ink-muted">
              <LayersIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">
              Aucune pool ne correspond à ces filtres
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Élargissez la recherche ou revenez au catalogue complet.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="secondary-button mt-6"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <DesktopResults pools={visiblePools} />
            <MobileResults pools={visiblePools} />
            {visibleCount < filteredPools.length && (
              <div className="flex justify-center border-t border-white/[0.06] p-5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((current) => current + PAGE_SIZE)
                  }
                  className="secondary-button"
                >
                  Afficher {Math.min(PAGE_SIZE, filteredPools.length - visibleCount)}{" "}
                  pools supplémentaires
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section id="methodologie" className="data-note">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-white">
            Rendement observé, pas rendement promis
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            « APY base » correspond généralement aux frais pour un DEX ;
            « rewards » aux incentives. Ces valeurs sont publiées par
            DefiLlama, peuvent varier fortement et n’intègrent ni impermanent
            loss, ni gas, ni fiscalité.
          </p>
        </div>
        <a
          href="https://github.com/DefiLlama/yield-server#apy-methodology"
          target="_blank"
          rel="noreferrer"
          className="secondary-button shrink-0"
        >
          Méthodologie
          <ExternalLinkIcon className="h-4 w-4" />
          <span className="sr-only">, ouvre un nouvel onglet</span>
        </a>
      </section>

      <section className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start gap-3">
          <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" />
          <div>
            <h2 className="text-sm font-medium text-white">
              Deux niveaux de couverture
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Les fiches synthétiques comparent les données agrégées. L’analyse
              complète Gnosis ajoute réserves RPC, composition et principaux
              holders LP vérifiés via Blockscout.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
