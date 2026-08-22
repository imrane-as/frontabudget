"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function DashboardChart({
  data
}: {
  data: { name: string; revenus: number; depenses: number }[];
}) {
  return (
    <div style={{ width: "100%", height: 310 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.16} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            contentStyle={{
              background: "#0d1a2b",
              border: "1px solid #20344e",
              borderRadius: 12
            }}
          />
          <Bar dataKey="revenus" fill="#34d399" radius={[6, 6, 0, 0]} />
          <Bar dataKey="depenses" fill="#fb7185" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
