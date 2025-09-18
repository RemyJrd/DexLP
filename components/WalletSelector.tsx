"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import clsx from "clsx";
import { useWatchlist } from "../store/useWatchlist";
import { addressSchema } from "../lib/validation";

export function WalletSelector() {
  const { address } = useAccount();
  const router = useRouter();
  const [input, setInput] = useState("");
  const watchlist = useWatchlist((state) => state.addresses);
  const addAddress = useWatchlist((state) => state.addAddress);
  const removeAddress = useWatchlist((state) => state.removeAddress);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input) return;
    const result = addressSchema.safeParse(input);
    if (!result.success) {
      setInput("");
      alert(result.error.errors[0]?.message ?? "Invalid address");
      return;
    }
    const addr = result.data;
    addAddress(addr);
    router.push(`/wallet/${addr}`);
    setInput("");
  };

  const handleUseConnected = () => {
    if (address) {
      const normalized = addressSchema.parse(address);
      addAddress(normalized);
      router.push(`/wallet/${normalized}`);
    }
  };

  return (
    <div className="card space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-sm uppercase tracking-wide text-gray-400">
          Wallet address
        </label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0x..."
            className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black"
          >
            Add
          </button>
        </div>
        <button
          type="button"
          onClick={handleUseConnected}
          disabled={!address}
          className={clsx(
            "w-full rounded-2xl border border-accent px-4 py-2 text-sm",
            !address && "opacity-40"
          )}
        >
          Use connected wallet
        </button>
      </form>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Watchlist</h3>
        {watchlist.length === 0 ? (
          <p className="text-sm text-gray-500">No wallets saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {watchlist.map((addr) => (
              <li key={addr} className="flex items-center justify-between gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                <Link href={`/wallet/${addr}`} className="truncate text-accent">
                  {addr}
                </Link>
                <button
                  onClick={() => removeAddress(addr)}
                  className="text-xs text-gray-400 hover:text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
