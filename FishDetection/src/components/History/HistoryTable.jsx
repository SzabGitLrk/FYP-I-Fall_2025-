import { useState } from 'react';
import { Trash2, Fish, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString();
}

function ConfirmDialog({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-bold">Delete Detection</h3>
        </div>
        <p className="text-slate-300 text-sm mb-6">Are you sure? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-xl text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTable({ records, onDelete }) {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PER_PAGE = 10;
  const totalPages = Math.ceil(records.length / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const current = records.slice(start, start + PER_PAGE);

  const confirmDelete = () => { if (deleteTarget) { onDelete(deleteTarget); setDeleteTarget(null); } };

  if (!records.length) {
    return (
      <div className="text-center py-14">
        <Fish className="w-14 h-14 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-300 font-medium">No detection history</p>
        <p className="text-slate-500 text-sm mt-1">Your detections will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/60">
              {['Image','Species','Confidence','Date','Status',''].map((h, i) => (
                <th key={i} className={`py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map(r => (
              <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-700 border border-slate-600/50">
                    {r.thumbnail
                      ? <img src={r.thumbnail} alt={r.species} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Fish className="w-5 h-5 text-slate-500" /></div>
                    }
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white font-medium text-sm">{r.species}</p>
                  {r.topPrediction && !r.detected && <p className="text-slate-500 text-xs mt-0.5">Alt: {r.topPrediction}</p>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.detected ? 'bg-teal-400' : 'bg-amber-400'}`} style={{ width: `${r.confidence}%` }} />
                    </div>
                    <span className="text-slate-300 text-sm tabular-nums">{r.confidence}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="text-slate-400 text-sm">{formatTimestamp(r.timestamp)}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    r.detected ? 'bg-teal-400/10 text-teal-300 border-teal-400/25' : 'bg-amber-400/10 text-amber-300 border-amber-400/25'
                  }`}>
                    {r.detected ? '✓ Detected' : '✗ No Match'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => setDeleteTarget(r.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">Showing {start + 1}–{Math.min(start + PER_PAGE, records.length)} of {records.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${n === page ? 'bg-teal-500 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
