import { TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SupportedCurrencies } from '../../server/src/schema';

// Import components
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { ConversionHistory } from '@/components/ConversionHistory';
import { ExchangeRates } from '@/components/ExchangeRates';

function App() {
  // State management
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrencies>([]);
  const [error, setError] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load supported currencies on component mount
  const loadSupportedCurrencies = useCallback(async () => {
    try {
      const currencies = await trpc.getSupportedCurrencies.query();
      setSupportedCurrencies(currencies);
    } catch (error) {
      console.error('Failed to load supported currencies:', error);
      setError('Failed to load currency options');
    }
  }, []);

  useEffect(() => {
    loadSupportedCurrencies();
  }, [loadSupportedCurrencies]);

  // Handle conversion completion to refresh history
  const handleConversionComplete = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh of history component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Currency Converter</h1>
          </div>
          <p className="text-gray-600">
            Convert between different currencies with real-time exchange rates
          </p>
        </div>

        {error && (
          <div className="mb-6 text-center text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* Main content with tabs */}
        <Tabs defaultValue="converter" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="converter" className="text-sm">
                💱 Converter
              </TabsTrigger>
              <TabsTrigger value="rates" className="text-sm">
                📈 Live Rates
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                📜 History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="converter" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <CurrencyConverter 
                supportedCurrencies={supportedCurrencies}
                onConversionComplete={handleConversionComplete}
              />
            </div>
          </TabsContent>

          <TabsContent value="rates" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <ExchangeRates supportedCurrencies={supportedCurrencies} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <ConversionHistory key={refreshKey} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>💡 Exchange rates are fetched from reliable financial data sources</p>
          <p className="mt-1">Rates may vary slightly from actual bank rates</p>
        </div>
      </div>
    </div>
  );
}

export default App;
