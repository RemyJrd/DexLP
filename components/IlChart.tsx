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

export function IlChart({ series }: Props) {
  if (!series.length) {
    return <div className="card h-80">No IL data yet. Provide liquidity to see history.</div>;
  }

  const data = series.map((point) => ({
    ...point,
    label: format(point.t, "HH:mm"),
    ilPct: point.il * 100,
  }));

  return (
    <div className="card h-80">
      <h3 className="mb-4 text-lg font-semibold">Impermanent Loss %</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" stroke="#6b7280" tickLine={false} />
          <YAxis stroke="#6b7280" tickFormatter={(value) => `${value.toFixed(2)}%`} />
          <Tooltip
            contentStyle={{ background: "#111827", borderRadius: 16, border: "1px solid #1f2937" }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [`${value.toFixed(3)}%`, "IL"]}
          />
          <Line type="monotone" dataKey="ilPct" stroke="#f472b6" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
