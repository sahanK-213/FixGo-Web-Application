import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartTooltip,
  PieChart, Pie, Cell
} from "recharts";
import { MONTH_NAMES, LINE_COLORS, HEALTH_CFG } from "./RevenueConstants";

function fmtY(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-[12px] min-w-[170px]">
      <p className="font-bold mb-2 text-gray-300">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke }} />
            {p.name}
          </span>
          <span className="font-semibold">LKR {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between font-bold">
        <span>Total</span><span>LKR {Number(total).toLocaleString()}</span>
      </div>
    </div>
  );
}

function RevenueBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const chartData = [...data].slice(0, 12).reverse().map(d => ({
    monthLabel: MONTH_NAMES[Number(d.month)],
    Garages: Number(d.garages || 0),
    "Service Centers": Number(d.serviceCenters || 0),
    "Spare Parts": Number(d.spareParts || 0),
  }));
  return (
    <div className="px-6 pt-2 pb-4">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {Object.entries(LINE_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key.replace(/ /g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={fmtY} width={45} />
          <RechartTooltip content={<CustomLineTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
          {Object.entries(LINE_COLORS).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#grad-${key.replace(/ /g, "-")})`}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 justify-center flex-wrap mt-1">
        {Object.entries(LINE_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 inline-block rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionHealth({ health, selectedMonth }) {
  const currentData = useMemo(() => {
     if (selectedMonth === "all") return health?.all_time || {};
     if (selectedMonth === "latest" && health?.months?.length > 0) return health.months[0].data;
     if (selectedMonth === "latest") return health?.all_time || {}; // fallback
     const m = health?.months?.find(m => m.label.startsWith(selectedMonth));
     return m ? m.data : {};
  }, [selectedMonth, health]);

  const rows = HEALTH_CFG.map(cfg => ({
    ...cfg,
    count:  Number(currentData[cfg.key]?.count  || 0),
    amount: Number(currentData[cfg.key]?.amount || 0),
  }));
  const total = rows.reduce((s, r) => s + r.count, 0);
  const pieData = total === 0
    ? [{ name: "Empty", value: 1, fill: "#e5e7eb" }]
    : rows.map(r => ({ name: r.label, value: r.count, fill: r.fill }));

  return (
    <div className="flex flex-col md:flex-row gap-6 px-6 py-5">
      {/* Donut */}
      <div className="flex items-center justify-center shrink-0">
        <PieChart width={180} height={180}>
          <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={80}
            paddingAngle={total === 0 ? 0 : 3} dataKey="value" stroke="none">
            {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <RechartTooltip
            content={({ active, payload }) =>
              active && payload?.length && total > 0 ? (
                <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
                  <span className="font-bold">{payload[0].name}</span>: {payload[0].value}
                </div>
              ) : null
            }
          />
        </PieChart>
      </div>
      {/* 2×2 grid */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {rows.map(r => {
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
          const isUrgent = r.pulse && r.count > 0;
          return (
            <div key={r.key} className={`rounded-[12px] border p-3.5 ${
              r.key === "Overdue" && r.count > 0 ? "border-red-100 bg-red-50/30" : "border-gray-100 bg-gray-50/40"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  {isUrgent && (
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block`}
                      style={{ background: r.fill }} />
                  )}
                  {r.label}
                </span>
                <span className={`text-xs font-bold ${r.text}`}>{pct}%</span>
              </div>
              <p className={`text-2xl font-extrabold m-0 ${r.text}`}>{r.count}</p>
              <p className="text-[11px] text-gray-400 m-0 mb-2">LKR {r.amount.toLocaleString()}</p>
              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-1 rounded-full ${r.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RevenueBarChart, CollectionHealth };
