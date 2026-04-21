import { Link } from 'react-router-dom';
import { Fish, ChevronRight, Clock } from 'lucide-react';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RecentDetections({ detections, limit = 5 }) {
  const items = detections.slice(0, limit);

  if (!detections?.length) {
    return (
      <div className="text-center py-10">
        <Fish className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">No detections yet</p>
        <Link to="/" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors">
          Start Detecting <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(d => (
        <div key={d.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40 hover:border-sky-400/25 transition-colors">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-700 shrink-0 border border-slate-600/50">
            {d.thumbnail
              ? <img src={d.thumbnail} alt={d.species} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Fish className="w-5 h-5 text-slate-500" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{d.species}</p>
            <div className="flex items-center gap-2 text-xs mt-0.5">
              <span className={d.detected ? 'text-teal-400' : 'text-amber-400'}>{d.confidence}%</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(d.timestamp)}</span>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full shrink-0 ${d.detected ? 'bg-teal-400' : 'bg-amber-400'}`} />
        </div>
      ))}
      {detections.length > limit && (
        <Link to="/history" className="flex items-center justify-center gap-2 py-3 text-teal-400 hover:text-teal-300 text-sm transition-colors">
          View all {detections.length} detections <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
