import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const schemes = {
  teal:   { icon: 'text-teal-400',   val: 'text-teal-300',   ring: 'bg-teal-400/10 border-teal-400/25' },
  blue:   { icon: 'text-sky-400',    val: 'text-sky-300',    ring: 'bg-sky-400/10 border-sky-400/25' },
  yellow: { icon: 'text-amber-400',  val: 'text-amber-300',  ring: 'bg-amber-400/10 border-amber-400/25' },
  red:    { icon: 'text-rose-400',   val: 'text-rose-300',   ring: 'bg-rose-400/10 border-rose-400/25' },
  purple: { icon: 'text-violet-400', val: 'text-violet-300', ring: 'bg-violet-400/10 border-violet-400/25' },
};

export default function StatsCard({ icon: Icon, label, value, suffix = '', trend, trendValue, colorScheme = 'teal' }) {
  const [display, setDisplay] = useState(0);
  const c = schemes[colorScheme] || schemes.teal;

  useEffect(() => {
    let n = 0;
    const step = value / 30;
    const t = setInterval(() => {
      n = Math.min(n + step, value);
      setDisplay(Math.round(n));
      if (n >= value) clearInterval(t);
    }, 33);
    return () => clearInterval(t);
  }, [value]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className="bg-[#0d1f35] rounded-2xl p-5 border border-sky-400/20 hover:border-sky-400/35 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${c.ring}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${c.val}`}>{display}{suffix}</p>
    </div>
  );
}
