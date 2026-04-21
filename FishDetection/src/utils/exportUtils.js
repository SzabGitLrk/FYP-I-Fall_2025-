import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Wire autoTable into jsPDF v4
applyPlugin(jsPDF);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function escapeCSV(v) {
  if (v == null) return '';
  const s = String(v);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function fmtTs(iso) { return new Date(iso).toLocaleString(); }

function dlBlob(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function calcStats(h) {
  const ok = h.filter(r => r.detected);
  const sp = {};
  ok.forEach(r => { sp[r.species] = (sp[r.species] || 0) + 1; });
  return {
    total: h.length,
    successful: ok.length,
    uniqueSpecies: new Set(ok.map(r => r.species)).size,
    avgConfidence: ok.length
      ? Math.round(ok.reduce((s, r) => s + r.confidence, 0) / ok.length) : 0,
    speciesCounts: sp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV / JSON exports
// ─────────────────────────────────────────────────────────────────────────────
export function exportToJSON(h, fn = 'detection-history') {
  dlBlob(JSON.stringify({
    exportDate: new Date().toISOString(), totalRecords: h.length,
    records: h.map(r => ({ id: r.id, species: r.species, confidence: r.confidence,
      timestamp: r.timestamp, detected: r.detected, topPrediction: r.topPrediction || null }))
  }, null, 2), 'application/json', `${fn}.json`);
}

export function exportToCSV(h, fn = 'detection-history') {
  const rows = h.map(r => [
    escapeCSV(r.id), escapeCSV(r.species), escapeCSV(r.confidence),
    escapeCSV(fmtTs(r.timestamp)), escapeCSV(r.detected ? 'Yes' : 'No'),
    escapeCSV(r.topPrediction || ''),
  ]);
  dlBlob(
    ['ID,Species,Confidence (%),Timestamp,Detected,Alternative Prediction',
      ...rows.map(r => r.join(','))].join('\n'),
    'text/csv;charset=utf-8;', `${fn}.csv`
  );
}

export function exportToJSONWithThumbnails(h, fn = 'detection-history-full') {
  dlBlob(JSON.stringify({
    exportDate: new Date().toISOString(), totalRecords: h.length, records: h
  }, null, 2), 'application/json', `${fn}.json`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF drawing helpers
// ─────────────────────────────────────────────────────────────────────────────
const DARK_BG   = [7,  20,  40];
const CARD_BG   = [13, 31,  53];
const TEAL      = [45, 212, 191];
const SKY       = [56, 189, 248];
const SLATE_400 = [100, 116, 139];
const SLATE_600 = [51,  65,  85];
const WHITE     = [255, 255, 255];

const SPECIES_COLORS = [
  [45,212,191],[56,189,248],[167,139,250],[52,211,153],
  [251,146,60],[244,114,182],[250,204,21],[96,165,250],
  [74,222,128],[232,121,249],
];

function setFont(doc, size, style = 'normal', color = WHITE) {
  doc.setFontSize(size);
  doc.setFont('helvetica', style);
  doc.setTextColor(...color);
}

function fillRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

function pageBg(doc, W, H) {
  fillRect(doc, 0, 0, W, H, DARK_BG);
  // Subtle teal accent top bar
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W * 0.6, 1.2, 'F');
  doc.setFillColor(...SKY);
  doc.rect(W * 0.6, 0, W * 0.2, 1.2, 'F');
}

function pageFooter(doc, W, H, pageNum, total) {
  fillRect(doc, 0, H - 8, W, 8, DARK_BG);
  doc.setDrawColor(...SLATE_600);
  doc.setLineWidth(0.3);
  doc.line(14, H - 8, W - 14, H - 8);
  setFont(doc, 7, 'normal', SLATE_600);
  doc.text('Marine AI · Underwater Species Detection System', 14, H - 3);
  doc.text(`Page ${pageNum} of ${total}`, W - 14, H - 3, { align: 'right' });
}

function sectionHeader(doc, label, title, y) {
  setFont(doc, 7, 'bold', TEAL);
  doc.text(label.toUpperCase(), 14, y);
  setFont(doc, 22, 'bold', WHITE);
  doc.text(title, 14, y + 12);
  doc.setDrawColor(...SKY);
  doc.setLineWidth(0.3);
  doc.line(14, y + 16, doc.internal.pageSize.getWidth() - 14, y + 16);
  return y + 22;
}

function statCard(doc, x, y, w, h, label, value, color) {
  // Card bg
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  // Top accent
  doc.setFillColor(...color);
  doc.rect(x, y, w, 1.5, 'F');
  // Value
  setFont(doc, 18, 'bold', color);
  doc.text(String(value), x + w / 2, y + h * 0.52, { align: 'center' });
  // Label
  setFont(doc, 7, 'normal', SLATE_400);
  doc.text(label, x + w / 2, y + h * 0.78, { align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 1 — Cover
// ─────────────────────────────────────────────────────────────────────────────
function drawCover(doc, stats, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  pageBg(doc, W, H);

  // Logo
  setFont(doc, 14, 'bold', TEAL);
  doc.text('Marine AI', 14, 18);
  setFont(doc, 8, 'normal', SLATE_400);
  doc.text('Underwater Species Detection System', 14, 25);

  doc.setDrawColor(...SLATE_600);
  doc.setLineWidth(0.3);
  doc.line(14, 29, W - 14, 29);

  // Main title
  setFont(doc, 36, 'bold', WHITE);
  doc.text('Detection', 14, 58);
  setFont(doc, 36, 'bold', TEAL);
  doc.text('Report', 14, 76);

  setFont(doc, 9, 'normal', SLATE_400);
  doc.text('AI-Powered Marine Species Identification & Analysis', 14, 86);

  // Date pill
  const ds = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFillColor(45, 212, 191, 0.15);
  doc.setFillColor(20, 60, 55);
  doc.roundedRect(14, 91, 90, 8, 4, 4, 'F');
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, 91, 90, 8, 4, 4, 'S');
  setFont(doc, 7, 'bold', TEAL);
  doc.text(`Generated: ${ds}`, 18, 96.5);

  // Stats cards
  const cards = [
    { label: 'Total Scans',    val: stats.total,                col: TEAL },
    { label: 'Successful',     val: stats.successful,           col: [52, 211, 153] },
    { label: 'Unique Species', val: stats.uniqueSpecies,        col: SKY },
    { label: 'Avg Confidence', val: `${stats.avgConfidence}%`,  col: [167, 139, 250] },
  ];
  const cw = (W - 28 - 9) / 4, ch = 28, sy = 108;
  cards.forEach((c, i) => statCard(doc, 14 + i * (cw + 3), sy, cw, ch, c.label, c.val, c.col));

  // Decorative section
  setFont(doc, 8, 'normal', SLATE_400);
  doc.text('This report contains:', 14, 148);
  const items = ['Cover & summary statistics', 'Species detection breakdown', 'Detection thumbnails gallery', 'Full detection log table'];
  items.forEach((item, i) => {
    setFont(doc, 8, 'normal', SLATE_400);
    doc.setFillColor(...TEAL);
    doc.circle(17, 155 + i * 9, 1, 'F');
    doc.text(item, 21, 155 + i * 9 + 1);
  });

  pageFooter(doc, W, H, 1, total);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 2 — Species breakdown
// ─────────────────────────────────────────────────────────────────────────────
function drawSpecies(doc, stats, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  pageBg(doc, W, H);

  let y = sectionHeader(doc, 'Species Analysis', 'Detection Breakdown', 8);

  const sorted = Object.entries(stats.speciesCounts).sort((a, b) => b[1] - a[1]);
  const maxC = sorted.length ? sorted[0][1] : 1;
  const BAR_X = 60, BAR_W = W - 90;

  if (!sorted.length) {
    setFont(doc, 11, 'normal', SLATE_400);
    doc.text('No successful detections yet.', W / 2, H / 2, { align: 'center' });
  }

  sorted.forEach(([sp, cnt], i) => {
    if (y > H - 20) return;
    const col = SPECIES_COLORS[i % SPECIES_COLORS.length];
    const pct = stats.successful ? Math.round((cnt / stats.successful) * 100) : 0;
    const bw = (cnt / maxC) * BAR_W;

    // Row bg
    doc.setFillColor(...(i % 2 === 0 ? CARD_BG : [10, 24, 45]));
    doc.rect(14, y - 3, W - 28, 14, 'F');

    // Species name
    setFont(doc, 9, 'bold', WHITE);
    doc.text(sp, 16, y + 5);

    // Count
    setFont(doc, 7, 'normal', SLATE_400);
    doc.text(`${cnt} detection${cnt !== 1 ? 's' : ''}`, 16, y + 10);

    // Bar track
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(BAR_X, y + 2, BAR_W, 4, 2, 2, 'F');

    // Bar fill
    doc.setFillColor(...col);
    doc.roundedRect(BAR_X, y + 2, Math.max(bw, 2), 4, 2, 2, 'F');

    // Pct label
    setFont(doc, 8, 'bold', col);
    doc.text(`${pct}%`, W - 14, y + 6, { align: 'right' });

    y += 16;
  });

  pageFooter(doc, W, H, 2, total);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 3 — Thumbnails
// ─────────────────────────────────────────────────────────────────────────────
async function drawThumbs(doc, history, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  pageBg(doc, W, H);

  let y = sectionHeader(doc, 'Visual Record', 'Detection Thumbnails', 8);

  const items = history.filter(r => r.detected && r.thumbnail).slice(0, 12);
  const COLS = 4, TW = (W - 28 - (COLS - 1) * 4) / COLS, TH = TW * 0.75;
  const SX = 14;

  if (!items.length) {
    setFont(doc, 10, 'normal', SLATE_400);
    doc.text('No detection thumbnails available.', W / 2, H / 2, { align: 'center' });
    pageFooter(doc, W, H, 3, total);
    return;
  }

  // Load all images first
  const loaded = await Promise.all(items.map(rec => new Promise(res => {
    const img = new Image();
    img.onload = () => res({ rec, img });
    img.onerror = () => res({ rec, img: null });
    img.src = rec.thumbnail;
  })));

  loaded.forEach(({ rec, img }, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = SX + col * (TW + 4);
    const cy = y + row * (TH + 20);
    if (cy + TH + 20 > H - 12) return;

    // Card bg
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, cy, TW, TH + 16, 2, 2, 'F');
    doc.setDrawColor(30, 58, 100);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, TW, TH + 16, 2, 2, 'S');

    // Image
    if (img) {
      try {
        doc.addImage(img, 'JPEG', x + 1, cy + 1, TW - 2, TH - 2);
      } catch (_) { /* skip broken image */ }
    }

    // Confidence badge
    const conf = rec.confidence;
    const bc = conf >= 75 ? TEAL : conf >= 50 ? [250, 204, 21] : [248, 113, 113];
    doc.setFillColor(...bc);
    doc.roundedRect(x + TW - 16, cy + 2, 14, 6, 3, 3, 'F');
    setFont(doc, 5.5, 'bold', DARK_BG);
    doc.text(`${conf}%`, x + TW - 9, cy + 6.2, { align: 'center' });

    // Label
    setFont(doc, 6.5, 'bold', WHITE);
    doc.text((rec.species || 'Unknown').slice(0, 16), x + 2, cy + TH + 6);
    setFont(doc, 5.5, 'normal', SLATE_400);
    doc.text(new Date(rec.timestamp).toLocaleDateString(), x + 2, cy + TH + 12);
  });

  pageFooter(doc, W, H, 3, total);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page 4 — Data table
// ─────────────────────────────────────────────────────────────────────────────
function drawTable(doc, history, pageOffset, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;

  pageBg(doc, W, H);

  // Page header
  setFont(doc, 7, 'bold', TEAL);
  doc.text('DETECTION LOG', M, 10);
  setFont(doc, 7, 'normal', SLATE_400);
  doc.text(`Marine AI · ${new Date().toLocaleDateString()}`, W - M, 10, { align: 'right' });

  const rows = history.map((r, i) => [
    String(i + 1),
    r.species || r.topPrediction || 'Unknown',
    r.detected ? `${r.confidence}%` : '—',
    r.detected ? 'Yes' : 'No',
    new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  ]);

  doc.autoTable({
    startY: 15,
    head: [['#', 'Species', 'Confidence', 'Detected', 'Date', 'Time']],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: [10, 32, 64],
      textColor: [45, 212, 191],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 7.5, textColor: [203, 213, 225], cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [13, 31, 53] },
    styles: { fillColor: [7, 20, 40], lineColor: [30, 58, 100], lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28 },
      5: { cellWidth: 22 },
    },
    margin: { left: M, right: M },
    didParseCell(d) {
      if (d.section === 'body' && d.column.index === 3)
        d.cell.styles.textColor = d.cell.raw === 'Yes' ? [52, 211, 153] : [248, 113, 113];
      if (d.section === 'body' && d.column.index === 2) {
        const v = parseInt(d.cell.raw);
        if (!isNaN(v))
          d.cell.styles.textColor = v >= 75 ? [52, 211, 153] : v >= 50 ? [250, 204, 21] : [248, 113, 113];
      }
    },
    didDrawPage(d) {
      const pg = d.pageNumber + pageOffset;
      fillRect(doc, 0, H - 8, W, 8, DARK_BG);
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE_600);
      doc.text('Marine AI · Underwater Species Detection', M, H - 2.5);
      doc.text(`Page ${pg} of ${total}`, W - M, H - 2.5, { align: 'right' });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function exportToPDF(history, filename = 'marine-ai-detection-report') {
  const stats = calcStats(history);
  const total = history.length > 0 ? 4 : 3;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Page 1 — Cover
  drawCover(doc, stats, total);

  // Page 2 — Species
  doc.addPage();
  drawSpecies(doc, stats, total);

  // Page 3 — Thumbnails
  doc.addPage();
  await drawThumbs(doc, history, total);

  // Page 4 — Table
  if (history.length > 0) {
    doc.addPage();
    drawTable(doc, history, 3, total);
  }

  doc.save(`${filename}.pdf`);
}

export default { exportToJSON, exportToCSV, exportToJSONWithThumbnails, exportToPDF };
