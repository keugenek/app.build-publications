import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { TripSuggestion } from '../../server/src/schema';

// Trip history functionality has been intentionally removed - app focuses only on real-time suggestions
function App() {
  const [city, setCity] = useState('');
  const [suggestion, setSuggestion] = useState<TripSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await trpc.getTripSuggestion.query({ city: city.trim() });
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
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain') || desc.includes('precipitation')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('storm')) return '⛈️';
    return '🌤️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✈️ Trip Weather Advisor
          </h1>
          <p className="text-gray-600">
            Get instant weather-based travel recommendations for tomorrow
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Where do you want to travel? 🌍</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city name..."
                value={city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !city.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '🔍 Checking...' : '🔍 Check Weather'}
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
          <Card className={`mb-6 ${suggestion.is_good_idea ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📍 {suggestion.city}
                  <Badge 
                    variant={suggestion.is_good_idea ? 'default' : 'secondary'}
                    className={suggestion.is_good_idea ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-orange-100 text-orange-800 hover:bg-orange-100'}
                  >
                    {suggestion.is_good_idea ? '✅ Good for Travel' : '⚠️ Not Ideal'}
                  </Badge>
                </CardTitle>
                <div className="text-2xl">
                  {getWeatherIcon(suggestion.weather_details.weather_description)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 font-medium">
                  {suggestion.reason}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-500">Temperature</div>
                    <div className="text-lg font-semibold text-gray-800">
                      🌡️ {suggestion.weather_details.max_temperature}°C
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-500">Precipitation</div>
                    <div className="text-lg font-semibold text-gray-800">
                      💧 {suggestion.weather_details.precipitation}mm
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-500">Conditions</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {suggestion.weather_details.weather_description}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 border-t pt-3">
                  📅 Forecast for: {new Date(suggestion.forecast_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!suggestion && !isLoading && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🌤️</div>
              <p className="text-gray-600 text-lg">
                Enter a city name above to get weather-based travel advice!
              </p>
              <p className="text-gray-500 text-sm mt-2">
                We'll analyze tomorrow's weather to help you decide if it's a good time to visit
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
