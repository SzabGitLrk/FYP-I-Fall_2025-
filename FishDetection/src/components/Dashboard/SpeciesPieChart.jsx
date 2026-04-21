import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Fish } from 'lucide-react';

const COLORS = ['#2dd4bf','#38bdf8','#a78bfa','#34d399','#fb923c','#f472b6','#facc15','#60a5fa','#4ade80','#e879f9'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = ((d.value / d.payload.total) * 100).toFixed(1);
  return (
    <div className="bg-[#0a1e35] border border-sky-400/25 rounded-xl p-3 shadow-xl">
      <p className="text-white font-semibold text-sm">{d.name}</p>
      <p className="text-teal-300 text-sm">{d.value} detection{d.value !== 1 ? 's' : ''}</p>
      <p className="text-slate-400 text-xs">{pct}% of total</p>
    </div>
  );
}

export default function SpeciesPieChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center gap-3">
        <Fish className="w-10 h-10 text-slate-600" />
        <p className="text-slate-400 text-sm">No species data yet</p>
        <p className="text-slate-500 text-xs">Start detecting to see distribution</p>
      </div>
    );
  }

  const total = data.reduce((s, i) => s + i.count, 0);
  const chartData = data.map(i => ({ name: i.species, value: i.count, total }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={44} outerRadius={80}
            paddingAngle={3} dataKey="value" stroke="none">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {chartData.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-slate-400 text-xs truncate max-w-20">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
