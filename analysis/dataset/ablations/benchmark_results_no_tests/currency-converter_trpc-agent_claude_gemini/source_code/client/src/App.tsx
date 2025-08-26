import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CurrencyConversionRequest, CurrencyConversionResponse, SupportedCurrencies } from '../../server/src/schema';

function App() {
  const [currencies, setCurrencies] = useState<SupportedCurrencies>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversion, setConversion] = useState<CurrencyConversionResponse | null>(null);
  const [error, setError] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CurrencyConversionRequest>({
    amount: 100,
    from: 'USD',
    to: 'EUR'
  });

  // Load supported currencies on mount
  const loadCurrencies = useCallback(async () => {
    try {
      const result = await trpc.getSupportedCurrencies.query();
      setCurrencies(result);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      setError('Failed to load supported currencies');
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (formData.from === formData.to) {
      setError('Source and target currencies must be different');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await trpc.convertCurrency.mutate(formData);
      setConversion(result);
    } catch (error) {
      console.error('Failed to convert currency:', error);
      setError('Failed to convert currency. Please try again.');
      setConversion(null);
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFormData((prev: CurrencyConversionRequest) => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
    // Clear previous conversion when swapping
    setConversion(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💱 Currency Converter</h1>
          <p className="text-gray-600">Convert currencies with real-time exchange rates</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Currency Conversion</CardTitle>
            <CardDescription>
              Enter an amount and select currencies to get the latest exchange rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CurrencyConversionRequest) => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))
                  }
                  step="0.01"
                  min="0.01"
                  required
                  className="text-lg"
                />
              </div>

              {/* Currency Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* From Currency */}
                <div className="space-y-2">
                  <Label htmlFor="from">From</Label>
                  <Select
                    value={formData.from}
                    onValueChange={(value: string) =>
                      setFormData((prev: CurrencyConversionRequest) => ({ ...prev, from: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{currency.code}</Badge>
                            <span>{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={swapCurrencies}
                    className="rounded-full"
                  >
                    ⇄
                  </Button>
                </div>

                {/* To Currency */}
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Select
                    value={formData.to}
                    onValueChange={(value: string) =>
                      setFormData((prev: CurrencyConversionRequest) => ({ ...prev, to: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{currency.code}</Badge>
                            <span>{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Convert Button */}
              <Button 
                type="submit" 
                disabled={isLoading || currencies.length === 0}
                className="w-full text-lg py-6"
              >
                {isLoading ? '🔄 Converting...' : '💱 Convert Currency'}
              </Button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">❌ {error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Result */}
        {conversion && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                ✅ Conversion Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {/* Main Conversion Display */}
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-blue-600">
                      {conversion.amount.toLocaleString()} {conversion.from}
                    </span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-600">
                      {conversion.result.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {conversion.to}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Exchange Rate Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="text-center">
                    <div className="font-semibold">Exchange Rate</div>
                    <div className="text-lg text-gray-900">
                      1 {conversion.from} = {conversion.rate.toLocaleString(undefined, {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4
                      })} {conversion.to}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold">Rate Date</div>
                    <div className="text-lg text-gray-900">{conversion.date}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold">Converted At</div>
                    <div className="text-lg text-gray-900">
                      {new Date(conversion.converted_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>💡 Exchange rates are provided by the Frankfurter API</p>
          <p className="mt-1">Rates are cached and updated daily for better performance</p>
        </div>
      </div>
    </div>
  );
}

export default App;
