import { useState } from 'react';
import { trpc } from './utils/trpc';
import { WeatherCard } from './components/WeatherCard';
import type { WeatherForecast } from '../../server/src/schema';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');
    setForecast(null);

    try {
      const result = await trpc.getWeatherForecast.query({ city });
      setForecast(result);
    } catch (err) {
      setError('Failed to fetch weather forecast. Please try again.');
      console.error('Error fetching weather forecast:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">Weather Advisor</h1>
          <p className="text-blue-100 mt-2">
            Should you go on a trip tomorrow?
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Enter City
              </label>
              <input
                id="city"
                type="text"
                placeholder="e.g., London, New York, Tokyo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? 'Checking Weather...' : 'Get Forecast'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {forecast && <WeatherCard forecast={forecast} />}
        </div>
      </div>
      
      <footer className="mt-8 text-center text-gray-600 text-sm">
        <p>Weather data provided by Open-Meteo API</p>
      </footer>
    </div>
  );
}

export default App;
