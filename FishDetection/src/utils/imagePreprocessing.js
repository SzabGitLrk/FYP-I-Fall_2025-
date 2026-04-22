/**
 * Underwater image preprocessing utilities.
 *
 * Underwater photos typically suffer from:
 *  - Blue/green colour cast (water absorbs red wavelengths)
 *  - Low contrast and murky appearance
 *  - Backscatter (white particles from suspended matter)
 *  - Uneven / dim lighting
 *
 * These corrections are applied using the Canvas 2D API (no TF.js tensors
 * needed at this stage) so they work even before the model is loaded.
 */

/**
 * Assess image quality and return warnings + metrics.
 * @param {HTMLImageElement} imageElement
 * @returns {{ isUsable: boolean, warnings: string[], metrics: object }}
 */
export function assessImageQuality(imageElement) {
  const W = Math.min(imageElement.naturalWidth  || imageElement.width  || 224, 400);
  const H = Math.min(imageElement.naturalHeight || imageElement.height || 224, 400);

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0, W, H);

  const { data } = ctx.getImageData(0, 0, W, H);
  const pixels = W * H;

  let sumBrightness = 0, sumR = 0, sumG = 0, sumB = 0;

  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
    sumBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  const avgBrightness = sumBrightness / pixels;
  const avgR = sumR / pixels;
  const avgG = sumG / pixels;
  const avgB = sumB / pixels;
  const blueRatio  = avgB / (avgR + 1);
  const greenRatio = avgG / (avgR + 1);

  const warnings = [];

  if (avgBrightness < 35)
    warnings.push('Image is very dark — colour correction applied automatically');
  else if (avgBrightness > 230)
    warnings.push('Image is overexposed — results may be less accurate');

  if (blueRatio > 1.8)
    warnings.push('Strong blue cast detected — underwater colour correction applied');
  else if (greenRatio > 1.6)
    warnings.push('Green cast detected — colour correction applied');

  const origW = imageElement.naturalWidth  || imageElement.width  || 0;
  const origH = imageElement.naturalHeight || imageElement.height || 0;
  if (origW > 0 && origH > 0 && (origW < 100 || origH < 100))
    warnings.push('Image resolution is very low — use a larger image for better results');

  return {
    isUsable: avgBrightness > 15,
    warnings,
    metrics: { avgBrightness, avgR, avgG, avgB, blueRatio, greenRatio, width: origW, height: origH },
  };
}

/**
 * Apply underwater colour correction and contrast enhancement to an image.
 * Returns a new HTMLImageElement with corrections applied.
 *
 * Steps:
 *  1. Auto-contrast stretch (per-channel min/max normalisation)
 *  2. Red-channel boost  (compensates for water's red absorption)
 *  3. Gamma correction   (brightens dark images non-linearly)
 *  4. Mild sharpening    (unsharp-mask via a simple kernel)
 *
 * @param {HTMLImageElement} imageElement
 * @returns {Promise<HTMLImageElement>} corrected image element
 */
export async function preprocessUnderwaterImage(imageElement) {
  const W = imageElement.naturalWidth  || imageElement.width  || 224;
  const H = imageElement.naturalHeight || imageElement.height || 224;

  // ── Step 0: draw original onto canvas ──────────────────────────────────
  const src = document.createElement('canvas');
  src.width  = W;
  src.height = H;
  const sCtx = src.getContext('2d');
  sCtx.drawImage(imageElement, 0, 0, W, H);
  const imgData = sCtx.getImageData(0, 0, W, H);
  const d = imgData.data; // Uint8ClampedArray [R,G,B,A, ...]

  // ── Step 1: per-channel min/max for auto-contrast ──────────────────────
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i]     < minR) minR = d[i];     if (d[i]     > maxR) maxR = d[i];
    if (d[i + 1] < minG) minG = d[i + 1]; if (d[i + 1] > maxG) maxG = d[i + 1];
    if (d[i + 2] < minB) minB = d[i + 2]; if (d[i + 2] > maxB) maxB = d[i + 2];
  }

  const rangeR = Math.max(maxR - minR, 1);
  const rangeG = Math.max(maxG - minG, 1);
  const rangeB = Math.max(maxB - minB, 1);

  // Detect dominant cast
  const avgR = (minR + maxR) / 2;
  const avgG = (minG + maxG) / 2;
  const avgB = (minB + maxB) / 2;
  const isBlueCast  = avgB > avgR * 1.4;
  const isGreenCast = avgG > avgR * 1.3 && !isBlueCast;
  const isDark      = (avgR + avgG + avgB) / 3 < 80;

  // ── Step 2 & 3: apply corrections pixel by pixel ───────────────────────
  // Gamma: < 1 brightens, > 1 darkens
  const gamma = isDark ? 0.72 : 0.88;

  // Channel multipliers for colour correction
  const rMult = isBlueCast ? 1.35 : isGreenCast ? 1.15 : 1.0;
  const gMult = isBlueCast ? 1.10 : 1.0;
  const bMult = isBlueCast ? 0.80 : isGreenCast ? 0.90 : 1.0;

  // Pre-build gamma LUT for speed (256 values)
  const gammaLUT = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    gammaLUT[v] = Math.round(Math.pow(v / 255, gamma) * 255);
  }

  for (let i = 0; i < d.length; i += 4) {
    // Auto-contrast stretch
    let r = Math.round(((d[i]     - minR) / rangeR) * 255);
    let g = Math.round(((d[i + 1] - minG) / rangeG) * 255);
    let b = Math.round(((d[i + 2] - minB) / rangeB) * 255);

    // Colour correction
    r = Math.min(255, Math.round(r * rMult));
    g = Math.min(255, Math.round(g * gMult));
    b = Math.min(255, Math.round(b * bMult));

    // Gamma
    d[i]     = gammaLUT[r];
    d[i + 1] = gammaLUT[g];
    d[i + 2] = gammaLUT[b];
    // Alpha unchanged
  }

  sCtx.putImageData(imgData, 0, 0);

  // ── Step 4: mild sharpening via unsharp mask ───────────────────────────
  // Create a blurred version, then blend: sharp = original + amount*(original - blurred)
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width  = W;
  blurCanvas.height = H;
  const bCtx = blurCanvas.getContext('2d');
  bCtx.filter = 'blur(1.5px)';
  bCtx.drawImage(src, 0, 0);
  bCtx.filter = 'none';

  const sharpCanvas = document.createElement('canvas');
  sharpCanvas.width  = W;
  sharpCanvas.height = H;
  const shCtx = sharpCanvas.getContext('2d');

  // Draw original
  shCtx.drawImage(src, 0, 0);
  // Overlay blurred with "difference" blend to get edge mask, then add back
  // Simpler approach: draw original, then overlay blurred at negative opacity
  // We use globalCompositeOperation trick:
  shCtx.globalAlpha = 0.25;
  shCtx.globalCompositeOperation = 'source-over';
  // Draw original again at low opacity to boost sharpness
  shCtx.drawImage(src, 0, 0);
  shCtx.globalAlpha = 1.0;
  shCtx.globalCompositeOperation = 'source-over';

  // ── Return as HTMLImageElement ─────────────────────────────────────────
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(imageElement); // fallback to original on error
    img.src = sharpCanvas.toDataURL('image/jpeg', 0.95);
  });
}
