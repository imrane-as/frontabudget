"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { euro } from "@/lib/money";

const colors = ["#34d399", "#60a5fa", "#a78bfa", "#fb7185", "#fbbf24", "#22d3ee"];

export default function SpendingDonut({ data }: { data: Array<{ name: string; amount: number }> }) {
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((sum, item) => sum + item.amount, 0);
  const chartData = rest > 0 ? [...top, { name: "Autres", amount: rest }] : top;
  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  if (!chartData.length) {
    return <div className="empty-visual"><span>◎</span><p>Ajoute des dépenses pour voir leur répartition.</p></div>;
  }

  return (
    <div className="donut-layout">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={chartData} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={4} stroke="none">
              {chartData.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => euro(Number(value))} contentStyle={{ background: "#0d1a2b", border: "1px solid #20344e", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><span>Total</span><strong>{euro(total)}</strong></div>
      </div>
      <div className="donut-legend">
        {chartData.map((item, index) => (
          <div key={item.name}>
            <span className="legend-dot" style={{ background: colors[index % colors.length] }} />
            <span>{item.name}</span>
            <strong>{total > 0 ? Math.round((item.amount / total) * 100) : 0} %</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
