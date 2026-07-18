import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActivityIcon,
  AlertIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  LayersIcon,
  ShieldIcon,
} from "../../../components/Icons";
import { getPoolCatalog } from "../../../lib/catalog-data";
import {
  CATALOG_CHAIN_LABELS,
  type CatalogPool,
} from "../../../lib/catalog-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiche pool — DexLP",
  description:
    "Fiche synthétique d’une pool de liquidité issue du catalogue multi-chain DexLP.",
};

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

function formatCurrency(value: number | null) {
  return value === null ? "—" : compactCurrency.format(value);
}

function formatApy(value: number | null, digits = 3) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) return "< 0,01 %";

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

function formatDelta(value: number | null) {
  if (value === null) return "—";
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

function shorten(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function SummaryMetric({
  label,
  value,
  detail,
  icon,
  fullValue,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  fullValue?: string;
}) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{label}</p>
        <span className="metric-icon">{icon}</span>
      </div>
      <p
        className="mt-5 text-[1.75rem] font-semibold tracking-[-0.04em] text-white"
        aria-label={fullValue}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{detail}</p>
    </article>
  );
}

function PoolDetail({
  pool,
  generatedAt,
}: {
  pool: CatalogPool;
  generatedAt: string;
}) {
  const riskLabel =
    pool.ilRisk === null
      ? "Non publié"
      : pool.ilRisk === "yes"
        ? "Exposition signalée"
        : "Non signalée";

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              <Link href="/" className="transition hover:text-white">
                Catalogue
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-accent">Fiche synthétique</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-pill">
                <span className="status-dot" />
                DefiLlama Yields
              </span>
              <span className="subtle-pill">
                {CATALOG_CHAIN_LABELS[pool.chain]}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow text-accent">{pool.protocolName}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                {pool.symbol.replaceAll("-", " / ")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">
                Vue comparable du marché : liquidité, activité et rendement
                publié. Cette fiche ne remplace pas une analyse du contrat ni
                d’une position individuelle.
              </p>
            </div>
            <a
              href={pool.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-button shrink-0"
            >
              Voir la source
              <ExternalLinkIcon className="h-4 w-4" />
              <span className="sr-only">, ouvre un nouvel onglet</span>
            </a>
          </div>

          <div className="pool-identity mt-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="version-pill">{pool.protocolName}</span>
                {pool.poolMeta && (
                  <span className="fee-pill">{pool.poolMeta}</span>
                )}
                <span className="risk-pill">
                  {pool.stablecoin === null
                    ? "Profil non publié"
                    : pool.stablecoin
                      ? "Stable"
                      : "Volatile"}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs text-ink-muted">
                ID DefiLlama · {shorten(pool.id)}
              </p>
            </div>
            <span className="coverage-pill coverage-pill-summary">
              Fiche synthétique
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Liquidité"
          value={formatCurrency(pool.tvlUsd)}
          fullValue={
            pool.tvlUsd === null
              ? "TVL indisponible"
              : fullCurrency.format(pool.tvlUsd)
          }
          detail="TVL publiée pour la pool"
          icon={<LayersIcon className="h-5 w-5" />}
        />
        <SummaryMetric
          label="APY publié"
          value={formatApy(pool.apy)}
          detail="Base et incentives agrégés"
          icon={<ActivityIcon className="h-5 w-5" />}
        />
        <SummaryMetric
          label="Volume 24 h"
          value={formatCurrency(pool.volumeUsd1d)}
          fullValue={
            pool.volumeUsd1d === null
              ? "Volume 24 heures indisponible"
              : fullCurrency.format(pool.volumeUsd1d)
          }
          detail="Activité récente de la pool"
          icon={<DatabaseIcon className="h-5 w-5" />}
        />
        <SummaryMetric
          label="Volume 7 jours"
          value={formatCurrency(pool.volumeUsd7d)}
          fullValue={
            pool.volumeUsd7d === null
              ? "Volume 7 jours indisponible"
              : fullCurrency.format(pool.volumeUsd7d)
          }
          detail="Somme publiée sur sept jours"
          icon={<DatabaseIcon className="h-5 w-5" />}
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel min-w-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Décomposition</p>
              <h2 className="section-title">Rendement publié</h2>
              <p className="section-description">
                Les valeurs sont conservées en APY, conformément à la source.
              </p>
            </div>
            <span className="source-pill">
              <DatabaseIcon className="h-3.5 w-3.5" />
              DefiLlama Yields
            </span>
          </div>

          <dl className="mt-7 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-black/10">
            <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">APY total</dt>
              <dd className="font-mono text-lg font-semibold text-white">
                {formatApy(pool.apy)}
              </dd>
            </div>
            <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">
                APY base
                <span className="mt-1 block text-[10px]">
                  Généralement les frais pour un DEX
                </span>
              </dt>
              <dd className="font-mono text-base text-white">
                {formatApy(pool.apyBase)}
              </dd>
            </div>
            <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">
                APY rewards
                <span className="mt-1 block text-[10px]">
                  Incentives en tokens
                </span>
              </dt>
              <dd className="font-mono text-base text-white">
                {formatApy(pool.apyReward)}
              </dd>
            </div>
            <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">Moyenne APY 30 jours</dt>
              <dd className="font-mono text-base text-white">
                {formatApy(pool.apyMean30d)}
              </dd>
            </div>
            <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">
                Variation d’APY sur 7 jours
              </dt>
              <dd
                className={`font-mono text-base ${
                  (pool.apyPct7D ?? 0) < 0 ? "text-rose-300" : "text-accent"
                }`}
              >
                {formatDelta(pool.apyPct7D)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel min-w-0 p-4 sm:p-6">
          <p className="eyebrow">Composition et risque</p>
          <h2 className="section-title">Actifs sous-jacents</h2>
          <p className="section-description">
            Adresses déclarées par l’adaptateur de la source.
          </p>

          {pool.underlyingTokens.length > 0 ? (
            <div className="mt-6 space-y-2">
              {pool.underlyingTokens.map((token, index) => (
                <div
                  key={token}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3"
                >
                  <span className="chain-mark shrink-0">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate font-mono text-xs text-white">
                    {token}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 inline-alert inline-alert-warning">
              <AlertIcon className="h-5 w-5 shrink-0" />
              <p className="text-xs">
                La source ne publie pas les adresses sous-jacentes pour cette
                pool.
              </p>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="balance-chip">
              <div>
                <dt className="text-xs text-ink-muted">Profil</dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {pool.stablecoin === null
                    ? "Non publié"
                    : pool.stablecoin
                      ? "Stable"
                      : "Volatile"}
                </dd>
              </div>
            </div>
            <div className="balance-chip">
              <div>
                <dt className="text-xs text-ink-muted">Risque d’IL</dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {riskLabel}
                </dd>
              </div>
            </div>
          </dl>
        </article>
      </section>

      <section className="data-note">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ShieldIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            Couverture synthétique, sans audit du contrat
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            L’APY est historique et variable. Il n’intègre pas automatiquement
            l’impermanent loss, le gas, le slippage ou la fiscalité. Pour voir
            les réserves et holders LP vérifiés on-chain, consultez la pool
            pilote Gnosis.
          </p>
        </div>
        <Link
          href="/pools/gnosis/sushi-v2/usdc-wxdai"
          className="secondary-button shrink-0"
        >
          Analyse Gnosis
        </Link>
      </section>

      <p className="text-center text-[11px] text-ink-muted">
        Catalogue synchronisé le{" "}
        <time dateTime={generatedAt}>{formatDate(generatedAt)}</time>.
      </p>
    </div>
  );
}

export default async function CatalogPoolPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  let catalog;

  try {
    catalog = await getPoolCatalog({ id: poolId });
  } catch {
    return (
      <section className="panel flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
          <AlertIcon className="h-7 w-7" />
        </div>
        <p className="eyebrow mt-6">Source indisponible</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Impossible de charger cette fiche
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-ink-muted">
          Le catalogue agrégé ne répond pas pour le moment. La fiche Gnosis
          alimentée directement on-chain reste disponible.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="secondary-button">
            Retour au catalogue
          </Link>
          <Link
            href="/pools/gnosis/sushi-v2/usdc-wxdai"
            className="primary-button"
          >
            Analyse Gnosis
          </Link>
        </div>
      </section>
    );
  }

  const pool = catalog.pools[0];
  if (!pool) notFound();

  return <PoolDetail pool={pool} generatedAt={catalog.generatedAt} />;
}
