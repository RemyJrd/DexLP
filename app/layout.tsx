import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { ExternalLinkIcon } from "../components/Icons";
import { POOL_CONFIG } from "../lib/pool-config";

export const metadata: Metadata = {
  title: "DexLP — Gnosis liquidity intelligence",
  description:
    "Tableau de bord public de la pool SushiSwap USDC/WXDAI sur Gnosis Chain.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="page-container flex h-full items-center justify-between gap-4">
              <Link href="/" className="brand" aria-label="DexLP, accueil">
                <span className="brand-mark" aria-hidden="true">
                  <span />
                  <span />
                </span>
                <span>
                  <span className="block text-sm font-semibold tracking-tight text-white">
                    DexLP
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-ink-muted">
                    Liquidity intelligence
                  </span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <span className="network-pill">
                  <span className="network-mark">G</span>
                  <span className="hidden sm:inline">Gnosis Chain</span>
                  <span className="sm:hidden">Gnosis</span>
                </span>
                <a
                  href={`${POOL_CONFIG.urls.explorer}/address/${POOL_CONFIG.pair.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="topbar-link"
                >
                  Explorer
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </header>

          <main className="page-container py-7 sm:py-10">{children}</main>

          <footer className="page-container pb-8 pt-2">
            <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <p>DexLP · Interface publique en lecture seule</p>
              <p>Gnosis RPC + Blockscout · Actualisation toutes les 30 s</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
