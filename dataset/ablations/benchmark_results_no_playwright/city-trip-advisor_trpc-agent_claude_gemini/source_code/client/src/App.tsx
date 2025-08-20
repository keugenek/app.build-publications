import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { TripSuggestion, TripSuggestionInput, GetTripSuggestionsInput } from '../../server/src/schema';

function App() {
  const [tripSuggestions, setTripSuggestions] = useState<TripSuggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<TripSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [formData, setFormData] = useState<TripSuggestionInput>({
    city: ''
  });

  const loadTripSuggestions = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const input: GetTripSuggestionsInput = { limit: 10 };
      const result = await trpc.getTripSuggestions.query(input);
      setTripSuggestions(result);
    } catch (error) {
      console.error('Failed to load trip suggestions:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTripSuggestions();
  }, [loadTripSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city.trim()) return;

    setIsLoading(true);
    setCurrentSuggestion(null);
    
    try {
      const response = await trpc.createTripSuggestion.mutate(formData);
      setCurrentSuggestion(response);
      setTripSuggestions((prev: TripSuggestion[]) => [response, ...prev]);
    } catch (error) {
      console.error('Failed to get trip suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherEmoji = (suggestion: 'Yes' | 'No', precipitation: number, tempMin: number, tempMax: number) => {
    if (suggestion === 'No') {
      if (precipitation > 2) return '🌧️';
      if (tempMax < 10) return '🥶';
      if (tempMin > 25) return '🥵';
      return '⛅';
    }
    if (precipitation < 0.5) return '☀️';
    return '🌤️';
  };

  const formatTemperature = (temp: number) => `${temp}°C`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌤️ Trip Weather Advisor
          </h1>
          <p className="text-lg text-gray-600">
            Get smart travel suggestions based on tomorrow's weather forecast
          </p>
        </div>

        {/* Trip Suggestion Form */}
        <Card className="mb-8 shadow-lg weather-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📍 Plan Your Trip
            </CardTitle>
            <CardDescription>
              Enter a city name to get a weather-based travel recommendation for tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                placeholder="Enter city name (e.g., Paris, Tokyo, New York)"
                value={formData.city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: TripSuggestionInput) => ({ ...prev, city: e.target.value }))
                }
                className="flex-1"
                required
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !formData.city.trim()} className="min-w-[120px]">
                {isLoading ? '🔍 Checking...' : '🔍 Check Weather'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Suggestion Display */}
        {currentSuggestion && (
          <Card className={`mb-8 shadow-lg border-2 weather-card weather-card-enter ${
            currentSuggestion.suggestion === 'Yes' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {getWeatherEmoji(currentSuggestion.suggestion, currentSuggestion.precipitation, currentSuggestion.temperature_min, currentSuggestion.temperature_max)}
                  {currentSuggestion.city}
                </CardTitle>
                <Badge 
                  variant={currentSuggestion.suggestion === 'Yes' ? 'default' : 'destructive'}
                  className="text-lg px-4 py-1 font-bold"
                >
                  {currentSuggestion.suggestion === 'Yes' ? '✅ Go for it!' : '❌ Maybe not'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weather Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">Temperature Range</div>
                  <div className="text-lg font-semibold">
                    {formatTemperature(currentSuggestion.temperature_min)} - {formatTemperature(currentSuggestion.temperature_max)}
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">Precipitation</div>
                  <div className="text-lg font-semibold">
                    {currentSuggestion.precipitation}mm
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">Forecast Date</div>
                  <div className="text-lg font-semibold">
                    {currentSuggestion.forecast_date.toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-white/60 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">💭 Why this suggestion?</h4>
                <p className="text-gray-700">{currentSuggestion.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Suggestions */}
        <Card className="shadow-lg weather-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Recent Suggestions
            </CardTitle>
            <CardDescription>
              Your previous trip weather consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="text-center py-8 text-gray-500 loading-pulse">
                🔄 Loading recent suggestions...
              </div>
            ) : tripSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                🌤️ No suggestions yet. Try checking the weather for a city above!
              </div>
            ) : (
              <div className="space-y-3">
                {tripSuggestions.map((suggestion: TripSuggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4 bg-gray-50/50 weather-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {getWeatherEmoji(suggestion.suggestion, suggestion.precipitation, suggestion.temperature_min, suggestion.temperature_max)}
                        </span>
                        <span className="font-semibold text-lg">{suggestion.city}</span>
                        <Badge 
                          variant={suggestion.suggestion === 'Yes' ? 'default' : 'secondary'}
                          className="font-medium"
                        >
                          {suggestion.suggestion}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {suggestion.created_at.toLocaleDateString()} {suggestion.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>🌡️ {formatTemperature(suggestion.temperature_min)} - {formatTemperature(suggestion.temperature_max)}</span>
                      <span>💧 {suggestion.precipitation}mm</span>
                      <span>📅 {suggestion.forecast_date.toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 italic">
                      {suggestion.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Weather data powered by Open-Meteo API 🌍</p>
          <p className="mt-1">
            Recommendations based on comfortable temperatures (10°C-25°C) and low precipitation (&lt;2mm)
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
