import { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { isFishCategory } from '../utils/fishCategories';
import { getSpeciesByModelLabel } from '../utils/speciesData';
import { preprocessUnderwaterImage } from '../utils/imagePreprocessing';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// How many ImageNet predictions to fetch per inference pass.
// Increased from 5 → 10 so marine classes that fall outside top-5 are caught.
const TOP_N_PREDICTIONS = 10;

// Per-species minimum confidence thresholds (0–100 scale after calibration).
// Visually distinctive species (sharks, whales) need higher confidence.
// Small or blurry species (seahorse, jellyfish) use a lower bar.
const SPECIES_THRESHOLDS = {
  'sharks':          12,
  'whale':           10,
  'dolphin':         10,
  'turtle-tortoise': 9,
  'sea-rays':        10,
  'jelly-fish':      7,
  'starfish':        7,
  'seahorse':        7,
  'octopus':         9,
  'crabs':           9,
};
const DEFAULT_THRESHOLD = 9; // fallback for any unmapped species

// ─────────────────────────────────────────────────────────────────────────────
// Confidence calibration
// ─────────────────────────────────────────────────────────────────────────────
/**
 * MobileNet distributes probability across 1,000 ImageNet classes.
 * A raw 15% score on a marine class is actually ~150× the random baseline (0.1%).
 * We rescale raw probabilities to a user-friendly 0–95 range.
 *
 * @param {number} rawProbability  0.0 – 1.0
 * @returns {number} calibrated score 0–95
 */
function calibrateConfidence(rawProbability) {
  const p = Math.max(0, Math.min(1, rawProbability));
  if (p < 0.05)  return Math.round(p * 400);               // 0 → 20
  if (p < 0.15)  return Math.round(20 + (p - 0.05) * 500); // 20 → 70
  if (p < 0.30)  return Math.round(70 + (p - 0.15) * 167); // 70 → 95
  return 95; // never claim 100% certainty
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-crop ensemble
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Run inference on 5 crops of the image and average the probabilities.
 * This catches species that are partially visible or off-centre.
 *
 * Crops (as fractions of image dimensions):
 *   [x, y, width, height]
 */
const CROPS = [
  [0,    0,    1,    1   ],  // Full image
  [0.1,  0.1,  0.8,  0.8 ],  // Centre 80%
  [0,    0,    0.65, 0.65],  // Top-left quadrant
  [0.35, 0,    0.65, 0.65],  // Top-right quadrant
  [0.1,  0.25, 0.8,  0.55],  // Centre horizontal strip
];

/**
 * Draw a crop of imageElement onto a canvas and return it as an HTMLImageElement.
 */
async function cropToImage(imageElement, cx, cy, cw, ch) {
  const W = imageElement.naturalWidth  || imageElement.width  || 224;
  const H = imageElement.naturalHeight || imageElement.height || 224;

  const canvas = document.createElement('canvas');
  canvas.width  = Math.max(1, Math.floor(W * cw));
  canvas.height = Math.max(1, Math.floor(H * ch));
  canvas.getContext('2d').drawImage(
    imageElement,
    Math.floor(W * cx), Math.floor(H * cy),
    Math.floor(W * cw), Math.floor(H * ch),
    0, 0,
    canvas.width, canvas.height,
  );

  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(imageElement); // fallback
    img.src = canvas.toDataURL('image/jpeg', 0.92);
  });
}

/**
 * Run MobileNet on all crops and return aggregated (averaged) predictions.
 * @param {object} model  MobileNet model instance
 * @param {HTMLImageElement} imageElement
 * @returns {Promise<Array<{className: string, probability: number}>>}
 */
async function multiCropClassify(model, imageElement) {
  const accumulated = {}; // className → sum of probabilities

  for (const [cx, cy, cw, ch] of CROPS) {
    try {
      const cropImg = await cropToImage(imageElement, cx, cy, cw, ch);
      const preds   = await model.classify(cropImg, TOP_N_PREDICTIONS);
      for (const p of preds) {
        const key = p.className.toLowerCase();
        accumulated[key] = (accumulated[key] || 0) + p.probability;
      }
    } catch (_) {
      // Skip failed crop — don't let one bad crop abort the whole detection
    }
  }

  const numCrops = CROPS.length;
  return Object.entries(accumulated)
    .map(([className, sumProb]) => ({
      className,
      probability: sumProb / numCrops, // average across crops
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, TOP_N_PREDICTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useFishDetector() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady,   setIsModelReady]   = useState(false);
  const [modelError,     setModelError]     = useState(null);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [result,         setResult]         = useState(null);

  const modelRef = useRef(null);

  // ── Load model on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        await tf.ready();
        const mobilenet = await import('@tensorflow-models/mobilenet');
        const model = await mobilenet.load({ version: 2, alpha: 1.0 });
        if (isMounted) {
          modelRef.current = model;
          setIsModelReady(true);
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error('Failed to load MobileNet model:', error);
        if (isMounted) {
          setModelError('Failed to load detection model. Please refresh the page.');
          setIsModelLoading(false);
        }
      }
    };

    loadModel();
    return () => { isMounted = false; };
  }, []);

  // ── Retry loader ─────────────────────────────────────────────────────────
  const retryLoad = useCallback(() => {
    setIsModelLoading(true);
    setIsModelReady(false);
    setModelError(null);

    tf.ready()
      .then(async () => {
        const mobilenet = await import('@tensorflow-models/mobilenet');
        return mobilenet.load({ version: 2, alpha: 1.0 });
      })
      .then(model => {
        modelRef.current = model;
        setIsModelReady(true);
        setIsModelLoading(false);
      })
      .catch(() => {
        setModelError('Failed to load detection model. Please refresh the page.');
        setIsModelLoading(false);
      });
  }, []);

  // ── Image validation ─────────────────────────────────────────────────────
  const isValidImage = (img) =>
    img instanceof HTMLImageElement &&
    img.complete &&
    img.naturalWidth > 0 &&
    img.naturalHeight > 0;

  // ── Main detection function ──────────────────────────────────────────────
  const detectFish = useCallback(async (imageElement) => {
    if (!modelRef.current || !isModelReady) throw new Error('Model not ready');

    setIsProcessing(true);
    setResult(null);

    if (!isValidImage(imageElement)) {
      const r = {
        detected: false, species: null, confidence: null,
        topPrediction: null, topConfidence: null,
        error: 'Unable to process image. It may be corrupted or unreadable.',
      };
      setResult(r);
      setIsProcessing(false);
      return r;
    }

    try {
      // ── 1. Preprocess: colour correction + contrast enhancement ──────────
      let processedImage = imageElement;
      try {
        processedImage = await preprocessUnderwaterImage(imageElement);
      } catch (prepErr) {
        console.warn('Preprocessing failed, using original image:', prepErr);
        processedImage = imageElement;
      }

      // ── 2. Multi-crop ensemble inference ────────────────────────────────
      const rawPredictions = await multiCropClassify(modelRef.current, processedImage);

      // ── 3. Map to our format + filter marine species ─────────────────────
      const allPredictions = rawPredictions.map(pred => {
        const isMarine  = isFishCategory(pred.className);
        const speciesObj = isMarine ? getSpeciesByModelLabel(pred.className) : null;
        return {
          rawLabel:    pred.className,
          species:     speciesObj ? speciesObj.commonName : pred.className,
          speciesId:   speciesObj ? speciesObj.id : null,
          rawProb:     pred.probability,
          confidence:  calibrateConfidence(pred.probability),
          isMarine,
        };
      });

      // ── 4. Find best marine prediction above per-species threshold ───────
      const marinePredictions = allPredictions.filter(p => p.isMarine);

      const fishPrediction = marinePredictions.find(pred => {
        const threshold = pred.speciesId
          ? (SPECIES_THRESHOLDS[pred.speciesId] ?? DEFAULT_THRESHOLD)
          : DEFAULT_THRESHOLD;
        return pred.confidence >= threshold;
      });

      // ── 5. Build result ──────────────────────────────────────────────────
      let detectionResult;

      if (fishPrediction) {
        // Successful detection
        detectionResult = {
          detected:    true,
          species:     fishPrediction.species,
          confidence:  fishPrediction.confidence,
          rawLabel:    fishPrediction.rawLabel,
          topPrediction:  null,
          topConfidence:  null,
          // Show all marine predictions in the confidence breakdown
          allPredictions: marinePredictions
            .filter(p => p.confidence > 0)
            .slice(0, 5)
            .map(p => ({ species: p.species, confidence: p.confidence })),
        };
      } else {
        // No marine species detected — show what the model actually saw
        const top = allPredictions[0] || { species: 'Unknown', confidence: 0 };
        detectionResult = {
          detected:       false,
          species:        null,
          confidence:     null,
          topPrediction:  top.species,
          topConfidence:  top.confidence,
          allPredictions: allPredictions.slice(0, 3).map(p => ({
            species:    p.species,
            confidence: p.confidence,
          })),
        };
      }

      setResult(detectionResult);
      setIsProcessing(false);
      return detectionResult;

    } catch (error) {
      console.error('Detection error:', error);
      const r = {
        detected: false, species: null, confidence: null,
        topPrediction: null, topConfidence: null,
        error: 'Unable to analyse this image. Please try another.',
      };
      setResult(r);
      setIsProcessing(false);
      return r;
    }
  }, [isModelReady]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setResult(null);
    setIsProcessing(false);
  }, []);

  return {
    isModelLoading,
    isModelReady,
    modelError,
    isProcessing,
    result,
    detectFish,
    reset,
    retryLoad,
  };
}
