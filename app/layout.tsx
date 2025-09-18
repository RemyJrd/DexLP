import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Web3ModalProvider } from "../providers/Web3ModalProvider";

export const metadata: Metadata = {
  title: "DexLP Dashboard",
  description: "Monitor SushiSwap USDC/DAI LP positions on Gnosis",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background">
        <Web3ModalProvider>
          <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">DexLP</h1>
                <p className="text-sm text-gray-400">
                  SushiSwap USDC/DAI liquidity dashboard on Gnosis.
                </p>
              </div>
              <w3m-button balance="hide" size="md" />
            </header>
            {children}
          </div>
        </Web3ModalProvider>
      </body>
    </html>
  );
}
