import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { BeerCounter } from '../../server/src/schema';
import './App.css';

function App() {
  const [beerCount, setBeerCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load beer count from server on mount
  useEffect(() => {
    const loadBeerCount = async () => {
      try {
        const result: BeerCounter = await trpc.getBeerCount.query();
        setBeerCount(result.count);
        // Also save to localStorage for persistence
        localStorage.setItem('beerCount', result.count.toString());
      } catch (error) {
        console.error('Failed to load beer count:', error);
        // Fallback to localStorage if server fails
        const savedCount = localStorage.getItem('beerCount');
        if (savedCount) {
          setBeerCount(parseInt(savedCount, 10) || 0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBeerCount();
  }, []);

  // Update server and localStorage when count changes
  const updateCount = async (newCount: number) => {
    try {
      setBeerCount(newCount);
      localStorage.setItem('beerCount', newCount.toString());
      await trpc.updateBeerCount.mutate({ count: newCount });
    } catch (error) {
      console.error('Failed to update beer count:', error);
    }
  };

  const increment = () => {
    updateCount(beerCount + 1);
  };

  const decrement = () => {
    if (beerCount > 0) {
      updateCount(beerCount - 1);
    }
  };

  const reset = () => {
    updateCount(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading beer counter...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-2 bg-amber-500/10">
          <CardTitle className="text-3xl font-bold text-amber-800 flex items-center justify-center gap-2">
            <span className="text-4xl">🍺</span>
            Beer Counter
            <span className="text-4xl">🍻</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-amber-700 mb-2">{beerCount}</div>
            <p className="text-amber-600">Beers Consumed</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Button 
              onClick={decrement}
              disabled={beerCount <= 0}
              className="bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg rounded-xl"
            >
              <span className="text-2xl">-</span>
            </Button>
            
            <Button 
              onClick={reset}
              className="bg-rose-500 hover:bg-rose-600 text-white py-6 text-lg rounded-xl"
            >
              Reset
            </Button>
            
            <Button 
              onClick={increment}
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg rounded-xl"
            >
              <span className="text-2xl">+</span>
            </Button>
          </div>
          
          <div className="mt-8 text-center text-sm text-amber-700/80">
            <p>Your beer count is automatically saved</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
