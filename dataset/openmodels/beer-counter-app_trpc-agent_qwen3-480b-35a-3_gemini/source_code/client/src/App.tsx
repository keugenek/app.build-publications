import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';

interface Counter {
  id: number;
  count: number;
  updated_at: Date;
}

function App() {
  const [counter, setCounter] = useState<Counter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load counter data
  useEffect(() => {
    const loadCounter = async () => {
      try {
        const result = await trpc.getCounter.query(1);
        setCounter(result);
      } catch (error) {
        console.error('Failed to load counter:', error);
        // Initialize with default values if server call fails
        setCounter({
          id: 1,
          count: 0,
          updated_at: new Date()
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCounter();
  }, []);

  // Save counter to server
  const saveCounter = async (newCount: number) => {
    if (!counter) return;
    
    try {
      const updatedCounter = await trpc.updateCounter.mutate({
        id: counter.id,
        count: newCount
      });
      setCounter(updatedCounter);
    } catch (error) {
      console.error('Failed to update counter:', error);
      // Update local state even if server update fails
      setCounter({
        ...counter,
        count: newCount,
        updated_at: new Date()
      });
    }
  };

  const handleIncrement = () => {
    if (counter) {
      const newCount = counter.count + 1;
      saveCounter(newCount);
    }
  };

  const handleDecrement = () => {
    if (counter && counter.count > 0) {
      const newCount = counter.count - 1;
      saveCounter(newCount);
    }
  };

  const handleReset = () => {
    if (counter) {
      saveCounter(0);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading beer counter...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <span>🍺</span> Beer Counter <span>🍺</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-6xl font-bold text-amber-600">
            {counter?.count || 0}
          </div>
          <p className="text-gray-500">
            {counter?.count === 1 ? 'beer' : 'beers'} counted
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleDecrement} 
              disabled={!counter || counter.count <= 0}
              className="bg-amber-700 hover:bg-amber-800"
            >
              Decrement (-)
            </Button>
            <Button 
              onClick={handleReset} 
              disabled={!counter || counter.count === 0}
              variant="secondary"
            >
              Reset
            </Button>
            <Button 
              onClick={handleIncrement}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Increment (+)
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 mt-6">
            Last updated: {counter?.updated_at ? new Date(counter.updated_at).toLocaleString() : 'Never'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
