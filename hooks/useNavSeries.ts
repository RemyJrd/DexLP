"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSnapshot, type NavSnapshot } from "../lib/math";
import { getPriceRatio } from "../lib/pricing";
import { loadNavSeries, saveNavSeries } from "../lib/storage";

const SNAP_INTERVAL = 1000 * 60 * 15;

export function useNavSeries(address?: string | null, nav?: number): {
  series: NavSnapshot[];
  latest?: NavSnapshot;
  ready: boolean;
} {
  const [series, setSeries] = useState<NavSnapshot[]>([]);
  const [ready, setReady] = useState(false);
  const baseRef = useRef<{ a0: number; b0: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!address) {
      setSeries([]);
      baseRef.current = null;
      setReady(false);
      return;
    }
    const stored = loadNavSeries(address);
    setSeries(stored);
    if (stored.length) {
      baseRef.current = { a0: stored[0].nav / 2, b0: stored[0].nav / 2 };
    }
    setReady(true);
  }, [address]);

  useEffect(() => {
    if (!address || !nav || nav <= 0) return;
    if (!series.length && ready) {
      const price = getPriceRatio();
      baseRef.current = { a0: nav / 2, b0: nav / 2 };
      const snapshot = createSnapshot({ nav, price }, baseRef.current ?? undefined);
      setSeries([snapshot]);
      saveNavSeries(address, [snapshot]);
    }
  }, [address, nav, series.length, ready]);

  useEffect(() => {
    if (!address || !nav || nav <= 0 || !baseRef.current) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const price = getPriceRatio();
      setSeries((prev) => {
        const previous = prev.at(-1);
        const snapshot = createSnapshot({ nav, price }, baseRef.current ?? undefined, previous);
        const updated = [...prev, snapshot].slice(-288);
        saveNavSeries(address, updated);
        return updated;
      });
    }, SNAP_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [address, nav]);

  const latest = series.at(-1);

  return useMemo(() => ({ series, latest, ready }), [series, latest, ready]);
}
