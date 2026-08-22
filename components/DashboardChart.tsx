"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { euro } from "@/lib/money";

export default function DashboardChart({
  data
}: {
  data: { name: string; revenus: number; depenses: number }[];
}) {
  return (
    <div style={{ width: "100%", height: 310 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#20344e" opacity={0.45} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#91a3ba", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} width={55} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip
            formatter={(value) => euro(Number(value))}
            contentStyle={{
              background: "#0d1a2b",
              border: "1px solid #20344e",
              borderRadius: 12
            }}
          />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: "#91a3ba" }} />
          <Bar dataKey="revenus" name="Revenus" fill="url(#incomeGradient)" radius={[7, 7, 0, 0]} maxBarSize={34} />
          <Bar dataKey="depenses" name="Dépenses" fill="url(#expenseGradient)" radius={[7, 7, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
