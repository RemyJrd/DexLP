"use client";

import { ReactNode, useEffect } from "react";
import { WagmiConfig } from "wagmi";
import { Web3Modal } from "@web3modal/wagmi/react";
import { gnosis, wagmiConfig } from "../lib/chains";
import { initWatchlist } from "../store/useWatchlist";

interface Props {
  children: ReactNode;
}

export function Web3ModalProvider({ children }: Props) {
  useEffect(() => {
    initWatchlist();
  }, []);

  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo";

  return (
    <WagmiConfig config={wagmiConfig}>
      {children}
      <Web3Modal projectId={projectId} themeMode="dark" chains={[gnosis]} />
    </WagmiConfig>
  );
}
