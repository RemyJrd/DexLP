"use client";

import { ReactNode, useEffect } from "react";
import { WagmiConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { gnosis, wagmiConfig, projectId } from "../lib/chains";
import { initWatchlist } from "../store/useWatchlist";

interface Props {
  children: ReactNode;
}

const queryClient = new QueryClient();

createWeb3Modal({
  wagmiConfig,
  projectId: projectId!,
  themeMode: "dark",
});

export function Web3ModalProvider({ children }: Props) {
  useEffect(() => {
    initWatchlist();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}
