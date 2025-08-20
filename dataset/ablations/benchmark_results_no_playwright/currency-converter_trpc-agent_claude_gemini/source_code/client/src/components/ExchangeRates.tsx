import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SupportedCurrencies } from '../../../server/src/schema';

interface ExchangeRatesProps {
  className?: string;
  supportedCurrencies: SupportedCurrencies;
}

interface ExchangeRateData {
  date: string;
  base: string;
  rates: Record<string, number>;
}

export function ExchangeRates({ className = '', supportedCurrencies }: ExchangeRatesProps) {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadExchangeRates = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const rates = await trpc.getExchangeRate.query({ baseCurrency });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      setError('Failed to load exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  const handleRefresh = () => {
    loadExchangeRates();
  };

  // Get the most popular currency pairs to display
  const getPopularPairs = () => {
    if (!exchangeRates) return [];
    
    const popularCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
    return popularCurrencies
      .filter(currency => currency !== baseCurrency && exchangeRates.rates[currency])
      .map(currency => ({
        currency,
        rate: exchangeRates.rates[currency],
        name: supportedCurrencies.find(c => c.code === currency)?.name || currency
      }))
      .slice(0, 6); // Show max 6 popular pairs
  };

  const popularPairs = getPopularPairs();

  return (
    <Card className={`${className} bg-white/80 backdrop-blur-sm`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Live Exchange Rates</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Current exchange rates for popular currency pairs
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Base currency selector */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Base Currency</label>
          <Select value={baseCurrency} onValueChange={setBaseCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {currency.code}
                    </Badge>
                    <span className="text-sm">{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exchange rates display */}
        {error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rates...</p>
          </div>
        ) : exchangeRates && popularPairs.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 mb-3">
              As of: {new Date(exchangeRates.date).toLocaleDateString()}
            </div>
            
            <div className="grid gap-3">
              {popularPairs.map((pair) => (
                <div
                  key={pair.currency}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {baseCurrency}
                      </Badge>
                      <span className="text-gray-400">→</span>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {pair.currency}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600 hidden sm:inline">
                      {pair.name}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {pair.rate.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500">
                      1 {baseCurrency} = {pair.rate.toFixed(4)} {pair.currency}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No rates available</p>
            <p className="text-sm">Please try selecting a different base currency</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
