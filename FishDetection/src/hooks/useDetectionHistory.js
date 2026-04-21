import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'fish-detection-history';
const MAX_RECORDS = 500;

/**
 * @typedef {Object} DetectionRecord
 * @property {string} id - Unique identifier
 * @property {string} species - Detected species name
 * @property {number} confidence - Confidence percentage (0-100)
 * @property {string} timestamp - ISO 8601 date string
 * @property {string} thumbnail - Base64 encoded image thumbnail
 * @property {boolean} detected - Whether fish was detected
 * @property {string} [topPrediction] - If no fish, what was detected
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} totalDetections
 * @property {number} successfulDetections
 * @property {number} uniqueSpecies
 * @property {number} averageConfidence
 * @property {Array<{species: string, count: number}>} speciesDistribution
 * @property {Array<{day: string, count: number}>} weeklyActivity
 * @property {DetectionRecord[]} recentDetections
 */

/**
 * Create a thumbnail from an image element
 * @param {HTMLImageElement} imageElement
 * @param {number} maxSize
 * @returns {string} Base64 encoded thumbnail
 */
function createThumbnail(imageElement, maxSize = 100) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let width = imageElement.naturalWidth || imageElement.width;
  let height = imageElement.naturalHeight || imageElement.height;
  
  // Calculate new dimensions maintaining aspect ratio
  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(imageElement, 0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Get the day name for a date
 * @param {Date} date
 * @returns {string}
 */
function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Check if two dates are the same calendar day
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Custom hook for managing detection history with local storage persistence
 * @returns {Object} History state and management functions
 */
export function useDetectionHistory() {
  const [history, setHistory, clearStorage, storageError] = useLocalStorage(STORAGE_KEY, []);

  // Add a new detection to history
  const addDetection = useCallback((result, imageElement) => {
    if (!result) return;

    const thumbnail = imageElement ? createThumbnail(imageElement) : '';
    
    const record = {
      id: uuidv4(),
      species: result.species || result.topPrediction || 'Unknown',
      confidence: result.confidence || result.topConfidence || 0,
      timestamp: new Date().toISOString(),
      thumbnail,
      detected: result.detected,
      topPrediction: result.topPrediction
    };

    setHistory(prev => {
      const newHistory = [record, ...prev];
      // Enforce max records limit
      if (newHistory.length > MAX_RECORDS) {
        return newHistory.slice(0, MAX_RECORDS);
      }
      return newHistory;
    });

    return record;
  }, [setHistory]);

  // Remove a detection by ID
  const removeDetection = useCallback((id) => {
    setHistory(prev => prev.filter(record => record.id !== id));
  }, [setHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    clearStorage();
  }, [clearStorage]);

  // Compute dashboard stats
  const stats = useMemo(() => {
    const now = new Date();
    const successfulDetections = history.filter(r => r.detected);
    
    // Total and successful counts
    const totalDetections = history.length;
    const successfulCount = successfulDetections.length;
    
    // Unique species
    const uniqueSpeciesSet = new Set(
      successfulDetections.map(r => r.species)
    );
    const uniqueSpecies = uniqueSpeciesSet.size;
    
    // Average confidence (only for successful detections)
    const averageConfidence = successfulCount > 0
      ? Math.round(
          successfulDetections.reduce((sum, r) => sum + r.confidence, 0) / successfulCount
        )
      : 0;
    
    // Species distribution
    const speciesCounts = {};
    successfulDetections.forEach(r => {
      speciesCounts[r.species] = (speciesCounts[r.species] || 0) + 1;
    });
    const speciesDistribution = Object.entries(speciesCounts)
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count);
    
    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = getDayName(date);
      const count = history.filter(r => {
        const recordDate = new Date(r.timestamp);
        return isSameDay(recordDate, date);
      }).length;
      weeklyActivity.push({ day: dayName, count });
    }
    
    // Recent detections (last 5)
    const recentDetections = history.slice(0, 5);
    
    // Today's count
    const todayCount = history.filter(r => {
      const recordDate = new Date(r.timestamp);
      return isSameDay(recordDate, now);
    }).length;

    return {
      totalDetections,
      successfulDetections: successfulCount,
      uniqueSpecies,
      averageConfidence,
      speciesDistribution,
      weeklyActivity,
      recentDetections,
      todayCount
    };
  }, [history]);

  // Check if at storage limit
  const isAtLimit = history.length >= MAX_RECORDS;
  const storageWarning = isAtLimit 
    ? `Storage limit reached (${MAX_RECORDS} records). Please export and clear old records.`
    : storageError;

  return {
    history,
    isLoading: false,
    error: storageError,
    storageWarning,
    isAtLimit,
    addDetection,
    removeDetection,
    clearHistory,
    stats
  };
}

export default useDetectionHistory;
