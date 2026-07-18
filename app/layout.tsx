import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { ExternalLinkIcon } from "../components/Icons";

export const metadata: Metadata = {
  title: "DexLP — Multi-chain liquidity intelligence",
  description:
    "Explorateur public de pools de liquidité, TVL et rendements sur plusieurs réseaux.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#main-content" className="skip-link">
          Aller au contenu
        </a>
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

              <nav
                className="flex items-center gap-1 sm:gap-2"
                aria-label="Navigation principale"
              >
                <Link href="/" className="topbar-link topbar-link-active">
                  Pools
                </Link>
                <Link
                  href="/pools/gnosis/sushi-v2/usdc-wxdai"
                  className="topbar-link"
                >
                  <span className="hidden sm:inline">Analyse Gnosis</span>
                  <span className="sm:hidden">Gnosis</span>
                </Link>
                <a
                  href="https://defillama.com/yields"
                  target="_blank"
                  rel="noreferrer"
                  className="topbar-link hidden md:inline-flex"
                >
                  Source
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </nav>
            </div>
          </header>

          <main id="main-content" className="page-container py-7 sm:py-10">
            {children}
          </main>

          <footer className="page-container pb-8 pt-2">
            <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <p>DexLP · Interface publique en lecture seule</p>
              <p>
                DefiLlama Yields · Gnosis RPC + Blockscout pour l’analyse
                détaillée
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
