import { useState, useEffect, useCallback } from 'react';

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Custom hook for managing state with localStorage persistence
 * @template T
 * @param {string} key - The localStorage key
 * @param {T} initialValue - Default value if key doesn't exist
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void, string | null]}
 */
export function useLocalStorage(key, initialValue) {
  const [storageAvailable] = useState(isLocalStorageAvailable);
  const [error, setError] = useState(null);

  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    if (!storageAvailable) {
      setError('Local storage is not available. Data will not persist between sessions.');
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      
      const parsed = JSON.parse(item);
      return parsed;
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
      setError('Failed to load saved data. Starting fresh.');
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (!storageAvailable) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
      setError(null);
    } catch (err) {
      console.error(`Error writing to localStorage key "${key}":`, err);
      
      // Check if it's a quota exceeded error
      if (err.name === 'QuotaExceededError' || 
          err.code === 22 || 
          err.code === 1014) {
        setError('Storage is full. Please export and clear some history.');
      } else {
        setError('Failed to save data.');
      }
    }
  }, [key, storedValue, storageAvailable]);

  // Setter function that handles both direct values and updater functions
  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Remove the item from localStorage
  const removeValue = useCallback(() => {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.error(`Error removing localStorage key "${key}":`, err);
      }
    }
    setStoredValue(initialValue);
  }, [key, initialValue, storageAvailable]);

  return [storedValue, setValue, removeValue, error];
}

export default useLocalStorage;
