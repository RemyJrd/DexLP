"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PoolApiError,
  PoolSnapshot,
  PoolTokenSnapshot,
} from "../lib/pool-types";
import {
  ActivityIcon,
  AlertIcon,
  CheckIcon,
  ContractIcon,
  CopyIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  LayersIcon,
  RefreshIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from "./Icons";

const REFRESH_MS = 30_000;

const currencyCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

const tokenNumber = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 6,
});

const integer = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function isPoolSnapshot(value: unknown): value is PoolSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "pool" in value &&
    "tokens" in value &&
    "metrics" in value
  );
}

function shortenAddress(address: string, head = 6, tail = 4) {
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function formatPct(value: number | null, maxDigits = 2) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) return "< 0,01 %";

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  }).format(value)} %`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function poolHealth(deviation: number) {
  if (deviation <= 0.5) {
    return {
      label: "Peg stable",
      detail: "Écart inférieur à 0,5 %",
      tone: "good",
    };
  }

  if (deviation <= 2) {
    return {
      label: "À surveiller",
      detail: "Écart compris entre 0,5 et 2 %",
      tone: "warning",
    };
  }

  return {
    label: "Écart marqué",
    detail: "Écart supérieur à 2 %",
    tone: "danger",
  };
}

function TokenMark({
  token,
  size = "md",
}: {
  token: PoolTokenSnapshot;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg"
      ? "h-12 w-12 text-sm"
      : size === "sm"
        ? "h-7 w-7 text-[9px]"
        : "h-10 w-10 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 font-bold text-background shadow-lg ${dimensions}`}
      style={{ backgroundColor: token.color }}
      title={token.symbol}
    >
      {token.symbol.slice(0, 2)}
    </span>
  );
}

function CopyButton({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="icon-button"
      aria-label={`Copier l’adresse ${value}`}
      title="Copier l’adresse"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-accent" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article className={`metric-card ${accent ? "metric-card-accent" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{label}</p>
        <span className="metric-icon">{icon}</span>
      </div>
      <p className="mt-5 text-[1.75rem] font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{detail}</p>
    </article>
  );
}

function ReserveRow({
  token,
  copied,
  onCopy,
  explorerBase,
}: {
  token: PoolTokenSnapshot;
  copied: boolean;
  onCopy: (value: string) => void;
  explorerBase: string;
}) {
  return (
    <div className="reserve-row">
      <div className="flex min-w-0 items-center gap-3">
        <TokenMark token={token} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{token.symbol}</p>
            <span className="token-type">ERC-20</span>
          </div>
          <p className="mt-1 truncate text-xs text-ink-muted">{token.name}</p>
        </div>
      </div>

      <div className="text-left sm:text-right">
        <p className="font-mono text-sm font-medium text-white">
          {tokenNumber.format(token.reserve)}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {currency.format(token.estimatedValueUsd)}
        </p>
      </div>

      <div className="hidden text-right lg:block">
        <p className="text-sm font-medium text-white">
          {formatPct(token.weightPct)}
        </p>
        <p className="mt-1 text-xs text-ink-muted">du TVL estimé</p>
      </div>

      <div className="flex items-center justify-end gap-1">
        <CopyButton
          value={token.address}
          copied={copied}
          onCopy={onCopy}
        />
        <a
          href={`${explorerBase}/address/${token.address}`}
          target="_blank"
          rel="noreferrer"
          className="icon-button"
          aria-label={`Voir ${token.symbol} sur Blockscout`}
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Chargement des données de la pool">
      <div className="panel p-6 sm:p-8">
        <div className="skeleton h-4 w-32" />
        <div className="mt-5 skeleton h-10 w-72 max-w-full" />
        <div className="mt-4 skeleton h-5 w-full max-w-2xl" />
        <div className="mt-8 skeleton h-20 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="metric-card" key={index}>
            <div className="skeleton h-3 w-24" />
            <div className="mt-6 skeleton h-8 w-36" />
            <div className="mt-3 skeleton h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="panel h-96 p-6">
          <div className="skeleton h-full w-full" />
        </div>
        <div className="panel h-96 p-6">
          <div className="skeleton h-full w-full" />
        </div>
      </div>
    </div>
  );
}

function FullError({
  message,
  retrying,
  onRetry,
}: {
  message: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="panel flex min-h-[440px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
        <AlertIcon className="h-7 w-7" />
      </div>
      <p className="eyebrow mt-6">Source RPC indisponible</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">
        Les données on-chain n’ont pas pu être chargées
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
        {message} L’application n’invente aucune valeur de secours : réessayez
        quand le RPC Gnosis est de nouveau joignable.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="primary-button mt-7"
      >
        <RefreshIcon
          className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
        />
        {retrying ? "Nouvelle lecture…" : "Réessayer"}
      </button>
    </section>
  );
}

export function PoolDashboard() {
  const [data, setData] = useState<PoolSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRefreshing(true);

    try {
      const response = await fetch("/api/pool", {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = (await response.json()) as PoolSnapshot | PoolApiError;

      if (!response.ok || !isPoolSnapshot(payload)) {
        const apiMessage =
          "error" in payload
            ? payload.error.message
            : "Réponse API inattendue.";
        throw new Error(apiMessage);
      }

      setData(payload);
      setError(null);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger la pool.",
      );
    } finally {
      if (activeRequest.current === controller) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void load();
    }, 0);
    const refreshTimer = window.setInterval(() => {
      void load();
    }, REFRESH_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
      activeRequest.current?.abort();
    };
  }, [load]);

  const copyAddress = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedAddress(value);
      window.setTimeout(() => {
        setCopiedAddress((current) => (current === value ? null : current));
      }, 1_800);
    } catch {
      setCopiedAddress(null);
    }
  }, []);

  if (!data && !error) {
    return <DashboardSkeleton />;
  }

  if (!data && error) {
    return (
      <FullError message={error} retrying={refreshing} onRetry={load} />
    );
  }

  if (!data) return null;

  const health = poolHealth(data.metrics.pegDeviationPct);
  const explorerBase = data.pool.explorerUrl.split("/address/")[0];
  const primaryToken = data.tokens[0];
  const secondaryToken = data.tokens[1];
  const holderCount =
    data.holders.count === null ? "—" : integer.format(data.holders.count);

  return (
    <div className="space-y-6">
      {error && (
        <div className="inline-alert inline-alert-warning" role="status">
          <AlertIcon className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-100">
              La dernière actualisation a échoué
            </p>
            <p className="mt-1 text-xs text-amber-100/65">
              Les dernières données valides restent affichées. {error}
            </p>
          </div>
          <button type="button" onClick={load} className="text-button">
            Réessayer
          </button>
        </div>
      )}

      <section className="hero-panel">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              <Link href="/" className="transition hover:text-white">
                Catalogue
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-accent">Analyse complète</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-pill">
                <span className="status-dot" />
                RPC connecté
              </span>
              <span className="subtle-pill">
                Bloc {integer.format(data.block.number)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow text-accent">État de la liquidité</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                Une lecture claire de la pool,
                <span className="text-gradient"> sans connecter de wallet.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
                Réserves en direct, équilibre des actifs et concentration des
                détenteurs LP sur SushiSwap V2, Gnosis Chain.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              className="primary-button shrink-0"
            >
              <RefreshIcon
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Lecture en cours…" : "Actualiser"}
            </button>
          </div>

          <div className="pool-identity mt-9">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex shrink-0 -space-x-3">
                {data.tokens.map((token) => (
                  <TokenMark key={token.address} token={token} size="lg" />
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    {data.pool.symbol}
                  </h2>
                  <span className="version-pill">
                    {data.protocol.name} {data.protocol.version}
                  </span>
                  <span className="fee-pill">
                    {number.format(data.protocol.feePct)} % de frais
                  </span>
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
                  <span className="font-mono">
                    {shortenAddress(data.pool.address, 10, 8)}
                  </span>
                  <CopyButton
                    value={data.pool.address}
                    copied={copiedAddress === data.pool.address}
                    onCopy={copyAddress}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={data.pool.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
              >
                Blockscout
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
              <a
                href={data.pool.sushiUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary-button hidden sm:inline-flex"
              >
                Sushi
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Liquidité estimée"
          value={currencyCompact.format(data.metrics.estimatedTvlUsd)}
          detail="Valorisation stablecoins à 1 USD"
          icon={<LayersIcon className="h-5 w-5" />}
          accent
        />
        <MetricCard
          label="Prix de la pool"
          value={new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 6,
          }).format(data.metrics.priceUsdcInWxdai)}
          detail={`WXDAI pour 1 USDC · écart ${formatPct(data.metrics.pegDeviationPct, 3)}`}
          icon={<ActivityIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Détenteurs LP"
          value={holderCount}
          detail="Adresses détenant directement le SLP"
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="Concentration top 1"
          value={formatPct(data.holders.topOnePct, 3)}
          detail="Peut inclure un coffre ou contrat agrégateur"
          icon={<ShieldIcon className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <article className="panel overflow-hidden">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Actifs de la pool</p>
              <h2 className="section-title">Réserves on-chain</h2>
              <p className="section-description">
                Soldes comptables du contrat de paire au dernier bloc lu.
              </p>
            </div>
            <span className="source-pill">
              <DatabaseIcon className="h-3.5 w-3.5" />
              {data.sources.rpc}
            </span>
          </div>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="composition-track" aria-label="Composition de la pool">
              {data.tokens.map((token) => (
                <span
                  key={token.address}
                  style={{
                    width: `${token.weightPct}%`,
                    backgroundColor: token.color,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
              <span>
                {primaryToken?.symbol ?? "Token 1"}{" "}
                {formatPct(primaryToken?.weightPct ?? 0)}
              </span>
              <span>Composition estimée en USD</span>
              <span>
                {secondaryToken?.symbol ?? "Token 2"}{" "}
                {formatPct(secondaryToken?.weightPct ?? 0)}
              </span>
            </div>

            <div className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-black/10">
              {data.tokens.map((token) => (
                <ReserveRow
                  key={token.address}
                  token={token}
                  copied={copiedAddress === token.address}
                  onCopy={copyAddress}
                  explorerBase={explorerBase}
                />
              ))}
            </div>
          </div>
        </article>

        <article className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Équilibre</p>
              <h2 className="section-title">Lecture du peg</h2>
            </div>
            <span className={`health-badge health-${health.tone}`}>
              <span />
              {health.label}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <div
              className="composition-ring"
              style={{
                background: `conic-gradient(${primaryToken?.color ?? "#77e6be"} 0 ${primaryToken?.weightPct ?? 50}%, ${secondaryToken?.color ?? "#7aa7ff"} ${primaryToken?.weightPct ?? 50}% 100%)`,
              }}
            >
              <div className="composition-ring-inner">
                <span className="text-3xl font-semibold tracking-[-0.05em] text-white">
                  {formatPct(data.metrics.pegDeviationPct, 3)}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                  écart au peg
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {data.tokens.map((token) => (
              <div key={token.address} className="balance-chip">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: token.color }}
                />
                <div>
                  <p className="text-xs text-ink-muted">{token.symbol}</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatPct(token.weightPct)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <ShieldIcon className="h-4 w-4 text-accent" />
              {health.detail}
            </div>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">
              Cet indicateur mesure uniquement le ratio interne de la pool. Ce
              n’est pas un oracle de prix.
            </p>
          </div>
        </article>
      </section>

      <section className="panel overflow-hidden">
        <div className="panel-heading border-b border-white/[0.06]">
          <div>
            <p className="eyebrow">Distribution du jeton SLP</p>
            <h2 className="section-title">Principaux détenteurs LP</h2>
            <p className="section-description">
              Quote-part directe du supply et réserves sous-jacentes estimées.
            </p>
          </div>
          {data.holders.status === "live" && (
            <div className="text-right">
              <p className="text-xs text-ink-muted">Top 10 cumulé</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatPct(data.holders.topTenPct, 3)}
              </p>
            </div>
          )}
        </div>

        {data.holders.status === "unavailable" ? (
          <div className="m-5 inline-alert inline-alert-warning sm:m-6">
            <AlertIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium text-amber-100">
                Liste des holders indisponible
              </p>
              <p className="mt-1 text-xs text-amber-100/65">
                {data.holders.error}
              </p>
            </div>
          </div>
        ) : data.holders.items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-ink-muted">
            Aucun détenteur LP trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="holders-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Détenteur</th>
                  <th>Solde SLP</th>
                  <th>Part du supply</th>
                  <th>Sous-jacent estimé</th>
                  <th aria-label="Lien Blockscout" />
                </tr>
              </thead>
              <tbody>
                {data.holders.items.map((holder) => (
                  <tr key={holder.address}>
                    <td>
                      <span
                        className={`rank-chip ${holder.rank === 1 ? "rank-chip-first" : ""}`}
                      >
                        {holder.rank.toString().padStart(2, "0")}
                      </span>
                    </td>
                    <td>
                      <div className="flex min-w-[185px] items-center gap-3">
                        <span className="holder-avatar">
                          {holder.addressType === "contract" ? (
                            <ContractIcon className="h-4 w-4" />
                          ) : (
                            <WalletIcon className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="max-w-32 truncate text-sm font-medium text-white">
                              {holder.label ??
                                shortenAddress(holder.address, 8, 6)}
                            </p>
                            <span className="address-type">
                              {holder.addressType === "contract"
                                ? "Contrat"
                                : "Wallet"}
                            </span>
                          </div>
                          {holder.label && (
                            <p className="mt-1 font-mono text-[10px] text-ink-muted">
                              {shortenAddress(holder.address, 8, 6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-white">
                        {tokenNumber.format(holder.balance)}
                      </span>
                    </td>
                    <td>
                      <div className="min-w-36">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-white">
                            {formatPct(holder.sharePct, 3)}
                          </span>
                        </div>
                        <div className="holder-share-track">
                          <span
                            style={{
                              width: `${Math.min(100, holder.sharePct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="min-w-44 space-y-1 text-xs">
                        {holder.underlying.map((asset) => (
                          <div
                            key={asset.symbol}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-ink-muted">
                              {asset.symbol}
                            </span>
                            <span className="font-mono text-white">
                              {tokenNumber.format(asset.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <a
                        href={`${explorerBase}/address/${holder.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-button"
                        aria-label={`Voir ${holder.address} sur Blockscout`}
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 text-[11px] leading-5 text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Un contrat (Safe, farm, coffre) peut représenter plusieurs
            bénéficiaires économiques.
          </p>
          <span className="source-pill w-fit">
            <DatabaseIcon className="h-3.5 w-3.5" />
            {data.sources.holders}
          </span>
        </div>
      </section>

      <section className="data-note">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            Données observées, pas une recommandation financière
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {data.methodology}
          </p>
        </div>
        <div className="shrink-0 text-left text-[11px] text-ink-muted sm:text-right">
          <p>Lecture RPC : {formatDate(data.generatedAt)}</p>
          <p className="mt-1">Bloc horodaté : {formatDate(data.block.timestamp)}</p>
        </div>
      </section>
    </div>
  );
}
