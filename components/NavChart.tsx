"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { NavSnapshot } from "../lib/math";

interface Props {
  series: NavSnapshot[];
}

export function NavChart({ series }: Props) {
  if (!series.length) {
    return <div className="card h-80">No NAV data yet. Snapshots will appear here.</div>;
  }

  const data = series.map((point) => ({
    ...point,
    label: format(point.t, "HH:mm"),
  }));

  return (
    <div className="card h-80">
      <h3 className="mb-4 text-lg font-semibold">NAV</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" stroke="#6b7280" tickLine={false} />
          <YAxis stroke="#6b7280" tickLine={false} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#111827", borderRadius: 16, border: "1px solid #1f2937" }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "NAV"]}
          />
          <Line type="monotone" dataKey="nav" stroke="#38bdf8" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
