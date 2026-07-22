import { useState, useEffect } from "react";

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsLoading(false), 200);
          return 100;
        }
        return prev + 10;
      });
    }, 30);
    return () => clearInterval(progressInterval);
  }, []);

  return { isLoading, loadingProgress };
};