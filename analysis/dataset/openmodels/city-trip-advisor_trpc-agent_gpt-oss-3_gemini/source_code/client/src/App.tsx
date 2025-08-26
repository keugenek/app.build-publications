import './App.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useState, useCallback } from 'react';
import type { CityWeatherInput, CityWeatherOutput } from '../../server/src/schema';

function App() {
  const [city, setCity] = useState<string>('');
  const [result, setResult] = useState<CityWeatherOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchWeather = useCallback(async (input: CityWeatherInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getCityWeather.query(input);
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Failed to fetch weather:', err);
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    await fetchWeather({ city: city.trim() });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Trip Weather Advisor</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 mb-8">
        <Input
          placeholder="Enter city name"
          value={city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Fetching...' : 'Get Weather Suggestion'}
        </Button>
      </form>

      {error && (
        <div className="text-red-600 mb-4" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">{result.city}</h2>
          <p className="mb-1">
            <span className="font-medium">Tomorrow's temperature:</span> {result.min_temperature}°C - {result.max_temperature}°C
          </p>
          <p className="mb-1">
            <span className="font-medium">Weather:</span> {result.description}
          </p>
          <p className="mb-3">
            <span className="font-medium">Precipitation probability:</span> {result.precipitation_probability}%
          </p>
          <p className={`font-bold text-lg ${result.suggestion === 'good' ? 'text-green-600' : 'text-red-600'}`}>
            Trip suggestion: {result.suggestion === 'good' ? 'Good idea! 🌞' : 'Not a good idea. 🌧️'}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
