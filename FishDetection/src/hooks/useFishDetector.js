import { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { isFishCategory } from '../utils/fishCategories';

const CONFIDENCE_THRESHOLD = 0.1; // 10% minimum confidence to count as a detection

export function useFishDetector() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const modelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadMobileNet = async () => {
      try {
        await tf.ready();
        // Load pre-trained MobileNet model using the @tensorflow-models package
        const mobilenet = await import('@tensorflow-models/mobilenet');
        const model = await mobilenet.load({
          version: 2,
          alpha: 1.0,
        });
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

    loadMobileNet();
    return () => { isMounted = false; };
  }, []);

  const retryLoad = useCallback(() => {
    setIsModelLoading(true);
    setIsModelReady(false);
    setModelError(null);
    
    tf.ready().then(async () => {
      const mobilenet = await import('@tensorflow-models/mobilenet');
      return mobilenet.load({ version: 2, alpha: 1.0 });
    }).then(model => {
      modelRef.current = model;
      setIsModelReady(true);
      setIsModelLoading(false);
    }).catch(err => {
      setModelError('Failed to load detection model. Please refresh the page.');
      setIsModelLoading(false);
    });
  }, []);

  const isValidImage = (img) =>
    img instanceof HTMLImageElement &&
    img.complete &&
    img.naturalWidth > 0 &&
    img.naturalHeight > 0;

  const detectFish = useCallback(async (imageElement) => {
    if (!modelRef.current || !isModelReady) throw new Error('Model not ready');

    setIsProcessing(true);
    setResult(null);

    if (!isValidImage(imageElement)) {
      const r = { detected: false, species: null, confidence: null, topPrediction: null, topConfidence: null, error: 'Unable to process image. It may be corrupted or unreadable.' };
      setResult(r);
      setIsProcessing(false);
      return r;
    }

    try {
      // MobileNet classify returns top predictions from ImageNet classes
      const predictions = await modelRef.current.classify(imageElement, 5);
      
      // Convert to our format
      const allPredictions = predictions.map(pred => ({
        species: pred.className,
        confidence: Math.round(pred.probability * 100),
        isFish: isFishCategory(pred.className),
      }));

      // Find the first fish/marine species prediction above threshold
      const fishPrediction = allPredictions.find(
        pred => pred.isFish && pred.confidence >= CONFIDENCE_THRESHOLD * 100
      );

      let detectionResult;

      if (fishPrediction) {
        // Fish detected!
        detectionResult = {
          detected: true,
          species: fishPrediction.species,
          confidence: fishPrediction.confidence,
          topPrediction: null,
          topConfidence: null,
          allPredictions: allPredictions.filter(p => p.isFish).map(p => ({
            species: p.species,
            confidence: p.confidence,
          })),
        };
      } else {
        // No fish detected - show what was actually detected
        const topPrediction = allPredictions[0];
        detectionResult = {
          detected: false,
          species: null,
          confidence: null,
          topPrediction: topPrediction.species,
          topConfidence: topPrediction.confidence,
          allPredictions: allPredictions.slice(0, 3).map(p => ({
            species: p.species,
            confidence: p.confidence,
          })),
        };
      }

      setResult(detectionResult);
      setIsProcessing(false);
      return detectionResult;
    } catch (error) {
      console.error('Detection error:', error);
      const r = { detected: false, species: null, confidence: null, topPrediction: null, topConfidence: null, error: 'Unable to analyze this image. Please try another.' };
      setResult(r);
      setIsProcessing(false);
      return r;
    }
  }, [isModelReady]);

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
