import { useState } from 'react';
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useDetectionHistory } from '../hooks/useDetectionHistory';
import HistoryTable from '../components/History/HistoryTable';
import ExportButtons from '../components/History/ExportButtons';

function ClearAllDialog({ isOpen, onConfirm, onCancel, count }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="text-white font-bold">Clear All History</h3>
        </div>
        <p className="text-slate-300 text-sm mb-2">Delete all {count} detection records?</p>
        <p className="text-amber-300 text-xs mb-6">This cannot be undone. Export your data first.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-xl text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors">Clear All</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [showClear, setShowClear] = useState(false);
  const { history, removeDetection, clearHistory, storageWarning } = useDetectionHistory();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Detection History</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {history.length > 0
              ? `${history.length} detection${history.length !== 1 ? 's' : ''} recorded`
              : 'No detections yet'}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButtons records={history} />
          <button
            onClick={() => setShowClear(true)}
            disabled={!history.length}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 border border-rose-400/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Storage warning */}
      {storageWarning && (
        <div className="mb-6 p-4 bg-amber-400/10 border border-amber-400/25 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">Storage Warning</p>
            <p className="text-amber-200/70 text-xs mt-0.5">{storageWarning}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6">
        <HistoryTable records={history} onDelete={removeDetection} />
      </div>

      <ClearAllDialog isOpen={showClear} count={history.length} onConfirm={() => { clearHistory(); setShowClear(false); }} onCancel={() => setShowClear(false)} />
    </div>
  );
}
