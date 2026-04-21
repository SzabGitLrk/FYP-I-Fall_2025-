import { createContext, useContext, useState } from 'react';

const DetectionContext = createContext(null);

export function DetectionProvider({ children }) {
  const [detectionState, setDetectionState] = useState({
    preview: null,
    result: null,
    savedToHistory: false
  });

  const updateDetectionState = (updates) => {
    setDetectionState(prev => ({ ...prev, ...updates }));
  };

  const clearDetectionState = () => {
    setDetectionState({
      preview: null,
      result: null,
      savedToHistory: false
    });
  };

  return (
    <DetectionContext.Provider value={{ 
      detectionState, 
      updateDetectionState, 
      clearDetectionState 
    }}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetectionContext() {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetectionContext must be used within a DetectionProvider');
  }
  return context;
}
