import { useState, useEffect, useCallback } from 'react';

export const useBeerCounter = () => {
  const [count, setCount] = useState<number>(0);

  // Load count from localStorage on component mount
  useEffect(() => {
    const savedCount = localStorage.getItem('beerCount');
    if (savedCount !== null) {
      const parsedCount = parseInt(savedCount, 10);
      if (!isNaN(parsedCount) && parsedCount >= 0) {
        setCount(parsedCount);
      }
    }
  }, []);

  // Save count to localStorage whenever count changes
  useEffect(() => {
    localStorage.setItem('beerCount', count.toString());
  }, [count]);

  const incrementCounter = useCallback((amount: number = 1) => {
    setCount((prevCount) => prevCount + amount);
  }, []);

  const decrementCounter = useCallback((amount: number = 1) => {
    setCount((prevCount) => Math.max(0, prevCount - amount)); // Prevent negative counts
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
    isLoading: false, // Not needed for localStorage, but matches expected interface
    isCelebrating: false, // Not needed for this simple version
    incrementCounter,
    decrementCounter,
    resetCounter,
    setCounter
  };
};
