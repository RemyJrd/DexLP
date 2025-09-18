"use client";

import { create } from "zustand";
import { loadWatchlist, saveWatchlist } from "../lib/storage";

interface WatchlistState {
  addresses: string[];
  addAddress: (address: string) => void;
  removeAddress: (address: string) => void;
  setAddresses: (addresses: string[]) => void;
}

export const useWatchlist = create<WatchlistState>((set, get) => ({
  addresses: [],
  setAddresses: (addresses) => {
    set({ addresses });
    saveWatchlist(addresses);
  },
  addAddress: (address) => {
    const normalized = address.toLowerCase();
    const current = get().addresses;
    if (current.includes(normalized)) return;
    const updated = [...current, normalized];
    set({ addresses: updated });
    saveWatchlist(updated);
  },
  removeAddress: (address) => {
    const normalized = address.toLowerCase();
    const updated = get().addresses.filter((item) => item !== normalized);
    set({ addresses: updated });
    saveWatchlist(updated);
  },
}));

export function initWatchlist() {
  if (typeof window === "undefined") return;
  const stored = loadWatchlist();
  if (stored.length) {
    useWatchlist.getState().setAddresses(stored.map((addr) => addr.toLowerCase()));
  }
}
