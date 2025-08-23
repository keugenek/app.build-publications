import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { WeatherForecast } from '../../server/src/schema';

function App() {
  const [cityName, setCityName] = useState('');
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    setIsLoading(true);
    setError(null);
    setForecast(null);

    try {
      const result = await trpc.getWeatherForecast.query({ cityName });
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather forecast');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Travel Weather Advisor</CardTitle>
            <CardDescription>
              Find out if tomorrow is a good day to visit a city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter city name"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Check'}
                </Button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                {error}
              </div>
            )}

            {forecast && (
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold">{forecast.city}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Forecast for {new Date(forecast.forecastDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Max Temperature</p>
                    <p className="text-2xl font-bold">{forecast.maxTemperature}°C</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Precipitation</p>
                    <p className="text-2xl font-bold">{forecast.precipitationProbability}%</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Badge 
                    variant={forecast.isGoodIdea ? "default" : "destructive"} 
                    className="text-lg py-2 px-6"
                  >
                    {forecast.isGoodIdea ? '👍 Good Idea' : '👎 Not a Good Idea'}
                  </Badge>
                </div>

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 p-3 rounded-md">
                  <p className="font-semibold mb-1">Travel Criteria:</p>
                  <ul className="list-disc pl-5 text-left space-y-1">
                    <li>Temperature between 15°C and 25°C: {forecast.maxTemperature >= 15 && forecast.maxTemperature <= 25 ? '✅' : '❌'}</li>
                    <li>Precipitation less than 30%: {forecast.precipitationProbability < 30 ? '✅' : '❌'}</li>
                  </ul>
                </div>
              </div>
            )}

            {!forecast && !error && !isLoading && (
              <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
                <p>Enter a city name to get weather forecast</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Open-Meteo API</p>
        </div>
      </div>
    </div>
  );
}

export default App;
