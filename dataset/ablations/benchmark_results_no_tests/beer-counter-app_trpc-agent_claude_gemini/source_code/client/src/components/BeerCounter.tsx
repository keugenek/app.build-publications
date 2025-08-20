import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBeerCounter } from './useBeerCounter';

export function BeerCounter() {
  const { count, incrementCounter, decrementCounter, resetCounter } = useBeerCounter();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-amber-600">
          🍺 Beer Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Count Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-amber-700 mb-2">
            {count}
          </div>
          <p className="text-lg text-gray-600">
            {count === 1 ? 'Beer' : 'Beers'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => incrementCounter()}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            size="lg"
          >
            ➕ Add
          </Button>
          
          <Button
            onClick={() => decrementCounter()}
            disabled={count === 0}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3"
            size="lg"
          >
            ➖ Remove
          </Button>
          
          <Button
            onClick={resetCounter}
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold py-3"
            size="lg"
          >
            🔄 Reset
          </Button>
        </div>

        {/* Fun Message */}
        {count > 0 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {count >= 10 && '🎉 Double digits! '}
            {count >= 20 && 'Wow, that\'s a lot! '}
            {count >= 50 && '🤯 Incredible! '}
            Keep track responsibly! 🍻
          </div>
        )}
      </CardContent>
    </Card>
  );
}
