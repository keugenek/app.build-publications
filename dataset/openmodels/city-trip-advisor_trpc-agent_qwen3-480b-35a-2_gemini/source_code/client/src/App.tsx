import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { WeatherData } from '../../server/src/schema';

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.getTripSuggestion.query({ city: city.trim() });
      setWeatherData(result);
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Trip Weather Advisor</CardTitle>
            <CardDescription>
              Find out if tomorrow is a good day for your trip
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter a city name"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !city.trim()}
              >
                {isLoading ? 'Checking Weather...' : 'Get Trip Advice'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {weatherData && (
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Trip Suggestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">City:</span>
                <span className="text-lg">{weatherData.city}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Max Temperature:</span>
                <span className="text-lg">{weatherData.maxTemperature}°C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Precipitation Probability:</span>
                <span className="text-lg">{weatherData.precipitationProbability}%</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="font-medium">Trip Recommendation:</span>
                <span className={`text-lg font-bold ${weatherData.isGoodIdea ? 'text-green-600' : 'text-red-600'}`}>
                  {weatherData.isGoodIdea ? 'Good Idea!' : 'Not a Good Idea'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
