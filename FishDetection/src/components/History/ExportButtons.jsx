import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, ChevronDown, Loader } from 'lucide-react';
import { exportToJSON, exportToCSV, exportToJSONWithThumbnails, exportToPDF } from '../../utils/exportUtils';

export default function ExportButtons({ records }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setIsOpen(false);
    setPdfLoading(true);
    try { await exportToPDF(records); }
    finally { setPdfLoading(false); }
  };

  const isDisabled = !records || records.length === 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled || pdfLoading}
        className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        {pdfLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {pdfLoading ? 'Building PDF…' : 'Export'}
        {!pdfLoading && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !isDisabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-blue-950 border border-blue-400 border-opacity-30 rounded-lg shadow-xl z-20 overflow-hidden">
            {[
              { label: 'Export as JSON',    sub: 'Without images',       icon: FileJson,        color: 'text-teal-400',   fn: () => { exportToJSON(records); setIsOpen(false); } },
              { label: 'Export as CSV',     sub: 'Spreadsheet format',   icon: FileSpreadsheet, color: 'text-blue-400',   fn: () => { exportToCSV(records); setIsOpen(false); } },
              { label: 'Export Full JSON',  sub: 'With thumbnails',      icon: FileJson,        color: 'text-purple-400', fn: () => { exportToJSONWithThumbnails(records); setIsOpen(false); } },
              { label: 'Export PDF Report', sub: 'Full designed report', icon: FileText,        color: 'text-rose-400',   fn: handleExportPDF },
            ].map(({ label, sub, icon: Icon, color, fn }, i) => (
              <button key={label} onClick={fn}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white hover:bg-opacity-10 transition-colors ${i > 0 ? 'border-t border-blue-800' : ''}`}>
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-blue-300">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
