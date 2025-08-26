import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'beerCounter';

export function useBeerCounter() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Load count from localStorage on mount
  useEffect(() => {
    try {
      const savedCount = localStorage.getItem(STORAGE_KEY);
      if (savedCount !== null) {
        const parsedCount = parseInt(savedCount, 10);
        if (!isNaN(parsedCount) && parsedCount >= 0) {
          setCount(parsedCount);
        }
      }
    } catch (error) {
      console.warn('Failed to load beer count from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save count to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, count.toString());
      } catch (error) {
        console.warn('Failed to save beer count to localStorage:', error);
      }
    }
  }, [count, isLoading]);

  const incrementCounter = useCallback((amount: number = 1) => {
    setCount(prevCount => {
      const newCount = prevCount + amount;
      // Trigger celebration animation for increment
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 600);
      return newCount;
    });
  }, []);

  const decrementCounter = useCallback((amount: number = 1) => {
    setCount(prevCount => Math.max(0, prevCount - amount));
  }, []);

  const resetCounter = useCallback(() => {
    setCount(0);
  }, []);

  const setCounter = useCallback((newCount: number) => {
    if (newCount >= 0) {
      setCount(newCount);
    }
  }, []);

  return {
    count,
    isLoading,
    isCelebrating,
    incrementCounter,
    decrementCounter,
    resetCounter,
    setCounter,
  };
}
