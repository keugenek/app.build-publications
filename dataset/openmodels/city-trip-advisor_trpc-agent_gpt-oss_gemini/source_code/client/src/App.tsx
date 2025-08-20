import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { GetForecastInput, Forecast } from '../../server/src/schema';

function App() {
  const [city, setCity] = React.useState<string>('');
  const [forecast, setForecast] = React.useState<Forecast | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const loadForecast = React.useCallback(async (cityName: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await trpc.getForecast.query({ city: cityName } as GetForecastInput);
      setForecast(data as Forecast);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch forecast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    await loadForecast(city.trim());
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Trip Recommendation</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <Input
          placeholder="Enter city name"
          value={city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Forecast'}
        </Button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {forecast && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">{forecast.city}</h2>
          <p className="text-sm text-gray-600 mb-2">
            {new Date(forecast.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="mb-1"><strong>Temperature:</strong> {forecast.min_temperature}°C – {forecast.max_temperature}°C</p>
          <p className="mb-1"><strong>Condition:</strong> {forecast.description}</p>
          <p className="mt-3 text-lg font-bold">
            Recommendation: <span className={forecast.recommendation === 'Good Idea' ? 'text-green-600' : 'text-red-600'}>{forecast.recommendation}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
