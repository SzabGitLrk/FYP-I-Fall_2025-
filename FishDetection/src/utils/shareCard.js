/**
 * Generates and downloads a shareable PNG detection card using Canvas API.
 * No external dependencies needed.
 *
 * @param {Object} opts
 * @param {string} opts.species       - Display name e.g. "Whale Shark"
 * @param {number} opts.confidence    - 0-100
 * @param {string} [opts.thumbnail]   - Base64 image data URL (optional)
 * @param {string} [opts.scientificName]
 * @param {string} [opts.category]
 */
export async function downloadShareCard({ species, confidence, thumbnail, scientificName, category }) {
  const W = 800, H = 420;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background gradient ──────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#071428');
  bg.addColorStop(0.5, '#0a2040');
  bg.addColorStop(1,   '#0c2d45');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Subtle radial glow ───────────────────────────────────────────────────
  const glow = ctx.createRadialGradient(W * 0.75, H * 0.5, 0, W * 0.75, H * 0.5, 300);
  glow.addColorStop(0,   'rgba(45,212,191,0.12)');
  glow.addColorStop(1,   'rgba(45,212,191,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Left accent bar ──────────────────────────────────────────────────────
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, '#2dd4bf');
  bar.addColorStop(1, '#0891b2');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 6, H);

  // ── Thumbnail (if provided) ──────────────────────────────────────────────
  const THUMB_X = W - 220, THUMB_Y = 40, THUMB_W = 180, THUMB_H = 180;
  if (thumbnail) {
    await new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        // Rounded rect clip
        ctx.save();
        roundRect(ctx, THUMB_X, THUMB_Y, THUMB_W, THUMB_H, 16);
        ctx.clip();
        ctx.drawImage(img, THUMB_X, THUMB_Y, THUMB_W, THUMB_H);
        ctx.restore();
        // Border
        ctx.strokeStyle = 'rgba(45,212,191,0.4)';
        ctx.lineWidth = 2;
        roundRect(ctx, THUMB_X, THUMB_Y, THUMB_W, THUMB_H, 16);
        ctx.stroke();
        resolve();
      };
      img.onerror = resolve;
      img.src = thumbnail;
    });
  }

  // ── Emoji ────────────────────────────────────────────────────────────────
  const EMOJIS = {
    'Crab':'🦀','Dolphin':'🐬','Jellyfish':'🪼','Octopus':'🦑',
    'Sea Ray':'🌊','Seahorse':'🐠','Shark':'🦈','Starfish':'⭐','Sea Turtle':'🐢','Whale':'🐋',
  };
  const emoji = EMOJIS[species] || '🐟';
  ctx.font = '64px serif';
  ctx.fillText(emoji, 36, 100);

  // ── "DETECTED" label ─────────────────────────────────────────────────────
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = '#2dd4bf';
  ctx.letterSpacing = '3px';
  ctx.fillText('SPECIES DETECTED', 36, 140);
  ctx.letterSpacing = '0px';

  // ── Species name ─────────────────────────────────────────────────────────
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(species, 36, 205);

  // ── Scientific name ──────────────────────────────────────────────────────
  if (scientificName) {
    ctx.font = 'italic 18px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(scientificName, 36, 235);
  }

  // ── Confidence bar ───────────────────────────────────────────────────────
  const BAR_Y = 270, BAR_X = 36, BAR_W = 380, BAR_H = 14;
  // Track
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, 7);
  ctx.fill();
  // Fill
  const fill = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
  fill.addColorStop(0, '#2dd4bf');
  fill.addColorStop(1, '#34d399');
  ctx.fillStyle = fill;
  roundRect(ctx, BAR_X, BAR_Y, BAR_W * (confidence / 100), BAR_H, 7);
  ctx.fill();
  // Label
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle = '#2dd4bf';
  ctx.fillText(`${confidence}%`, BAR_X, BAR_Y + 50);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('confidence', BAR_X + 68, BAR_Y + 50);

  // ── Category badge ───────────────────────────────────────────────────────
  if (category) {
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    ctx.font = 'bold 12px system-ui, sans-serif';
    const tw = ctx.measureText(label).width;
    const bx = 36, by = BAR_Y + 70, bw = tw + 24, bh = 26;
    ctx.fillStyle = 'rgba(45,212,191,0.12)';
    roundRect(ctx, bx, by, bw, bh, 13);
    ctx.fill();
    ctx.strokeStyle = 'rgba(45,212,191,0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 13);
    ctx.stroke();
    ctx.fillStyle = '#2dd4bf';
    ctx.fillText(label, bx + 12, by + 17);
  }

  // ── Divider ──────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(56,189,248,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(36, H - 60); ctx.lineTo(W - 36, H - 60); ctx.stroke();

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = '#2dd4bf';
  ctx.fillText('🐟 Marine AI', 36, H - 28);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Underwater Species Detection · Powered by TensorFlow.js', 36, H - 10);

  // Timestamp right-aligned
  const ts = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'right';
  ctx.fillText(ts, W - 36, H - 28);
  ctx.textAlign = 'left';

  // ── Download ─────────────────────────────────────────────────────────────
  const link = document.createElement('a');
  link.download = `marine-ai-${species.toLowerCase().replace(/\s+/g, '-')}-${confidence}pct.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Helper: draw rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
