import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Calendar } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1e35] border border-sky-400/25 rounded-xl p-3 shadow-xl">
      <p className="text-white font-semibold text-sm">{label}</p>
      <p className="text-teal-300 text-sm">{payload[0].value} detection{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function ActivityBarChart({ data }) {
  const hasData = data?.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-56 flex flex-col items-center justify-center gap-3">
        <Calendar className="w-10 h-10 text-slate-600" />
        <p className="text-slate-400 text-sm">No activity this week</p>
        <p className="text-slate-500 text-xs">Start detecting to track activity</p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(45,212,191,0.06)' }} />
          <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
