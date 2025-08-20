import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { MapPin, Thermometer, CloudRain, Calendar, CheckCircle, XCircle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { TripSuggestion } from '../../server/src/schema';

function App() {
  const [city, setCity] = useState<string>('');
  const [suggestion, setSuggestion] = useState<TripSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    
    setIsLoading(true);
    setError('');
    setSuggestion(null);
    
    try {
      const result = await trpc.getTripSuggestion.query({ city: city.trim() });
      setSuggestion(result);
    } catch (err) {
      console.error('Failed to get trip suggestion:', err);
      setError('Failed to get weather data. Please check the city name and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌤️ Trip Weather Advisor
          </h1>
          <p className="text-lg text-gray-600">
            Should you take that trip tomorrow? Let the weather decide! ✈️
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="w-5 h-5" />
              Where are you planning to go?
            </CardTitle>
            <CardDescription>
              Enter a city name to get tomorrow's weather forecast and trip recommendation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter city name (e.g., Paris, New York, Tokyo)"
                  value={city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !city.trim()}
                  className="px-6"
                >
                  {isLoading ? 'Checking...' : 'Get Advice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Trip Suggestion Result */}
        {suggestion && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {suggestion.is_good_idea ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                <CardTitle className="text-2xl">
                  Trip to {suggestion.city}
                </CardTitle>
              </div>
              
              <Badge 
                variant={suggestion.is_good_idea ? 'default' : 'destructive'}
                className="text-lg px-4 py-2 font-semibold"
              >
                {suggestion.is_good_idea ? '✅ Great Idea!' : '❌ Maybe Not'}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Date */}
              <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>Tomorrow - {formatDate(suggestion.date)}</span>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Temperature</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {suggestion.temperature}°C
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CloudRain className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-gray-700">Precipitation</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {suggestion.precipitation}mm
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200 md:col-span-1">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg">🌤️</span>
                      <span className="font-medium text-gray-700">Conditions</span>
                    </div>
                    <div className="text-lg font-medium text-purple-700">
                      {suggestion.weather_description}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reason */}
              <Alert className={`border-2 ${
                suggestion.is_good_idea 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <AlertDescription className={`text-lg ${
                  suggestion.is_good_idea 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  <strong>Why? </strong>{suggestion.reason}
                </AlertDescription>
              </Alert>

              {/* Additional Info */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                💡 <strong>Good trip conditions:</strong> Temperature between 10°C-25°C with minimal precipitation
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Weather data powered by Open-Meteo API 🌍</p>
          <p className="mt-1">Plan your adventures wisely! 🎒</p>
        </div>
      </div>
    </div>
  );
}

export default App;
