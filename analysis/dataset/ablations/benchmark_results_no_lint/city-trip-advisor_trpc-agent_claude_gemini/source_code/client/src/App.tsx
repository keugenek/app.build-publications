import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { TripSuggestionResponse } from '../../server/src/schema';

function App() {
  const [cityInput, setCityInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<TripSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await trpc.getTripSuggestion.query({ city: cityInput.trim() });
      setSuggestion(result);
    } catch (err) {
      console.error('Failed to get trip suggestion:', err);
      setError('Failed to get trip suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('sun') || desc.includes('clear')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const getSuggestionColor = (isGoodIdea: boolean) => {
    return isGoodIdea 
      ? 'border-green-200 bg-green-50' 
      : 'border-red-200 bg-red-50';
  };

  const getSuggestionIcon = (isGoodIdea: boolean) => {
    return isGoodIdea ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌍 Trip Weather Advisor
          </h1>
          <p className="text-gray-600 text-lg">
            Should you take that trip tomorrow? Let's check the weather! ✈️
          </p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏙️ Enter Your Destination
            </CardTitle>
            <CardDescription>
              Type in the city you're planning to visit tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                placeholder="e.g., Paris, London, Tokyo..."
                value={cityInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setCityInput(e.target.value)
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !cityInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '🔍 Checking...' : '🌦️ Check Weather'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              ⚠️ {error}
            </AlertDescription>
          </Alert>
        )}

        {suggestion && (
          <div className="space-y-6">
            <Card className={`shadow-lg ${getSuggestionColor(suggestion.isGoodIdea)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  {getSuggestionIcon(suggestion.isGoodIdea)}
                  Trip Recommendation for {suggestion.city}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold mb-4">
                  {suggestion.message}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌤️ Tomorrow's Weather Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl mb-2">🌡️</div>
                    <div className="font-semibold text-gray-700">Temperature</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {suggestion.weather.temperature}°C
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl mb-2">💧</div>
                    <div className="font-semibold text-gray-700">Precipitation</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {suggestion.weather.precipitation}mm
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl mb-2">
                      {getWeatherIcon(suggestion.weather.weather_description)}
                    </div>
                    <div className="font-semibold text-gray-700">Conditions</div>
                    <div className="text-sm font-medium text-blue-600 mt-1">
                      {suggestion.weather.weather_description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-2">💡 How we decide:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Perfect temperature: 10°C to 25°C ✅</li>
                    <li>Low precipitation: Less than 5mm of rain/snow ✅</li>
                    <li>Both conditions must be met for a "good idea" recommendation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!suggestion && !error && !isLoading && (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-500 text-lg">
                Enter a city name above to get your personalized trip recommendation!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
