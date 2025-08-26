import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CurrencyInfo, CurrencyConversionRequest, CurrencyConversionResponse } from '../../server/src/schema';

function App() {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [conversionResult, setConversionResult] = useState<CurrencyConversionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  // Form state
  const [formData, setFormData] = useState<CurrencyConversionRequest>({
    amount: 1,
    from_currency: 'USD',
    to_currency: 'EUR'
  });

  // Load available currencies
  const loadCurrencies = useCallback(async () => {
    try {
      setIsLoadingCurrencies(true);
      const result = await trpc.getCurrencies.query();
      setCurrencies(result);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    setIsLoading(true);
    try {
      const result = await trpc.convertCurrency.mutate(formData);
      setConversionResult(result);
    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFormData((prev: CurrencyConversionRequest) => ({
      ...prev,
      from_currency: prev.to_currency,
      to_currency: prev.from_currency
    }));
    // Clear previous result when swapping
    setConversionResult(null);
  };

  const getFromCurrencyInfo = () => currencies.find(c => c.code === formData.from_currency);
  const getToCurrencyInfo = () => currencies.find(c => c.code === formData.to_currency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💱 Currency Converter
          </h1>
          <p className="text-gray-600">
            Convert between different currencies with real-time exchange rates
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Currency Conversion
            </CardTitle>
            <CardDescription>
              Enter an amount and select currencies to get the latest exchange rate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleConvert} className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CurrencyConversionRequest) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="text-lg font-semibold"
                  required
                />
              </div>

              {/* Currency Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* From Currency */}
                <div className="space-y-2">
                  <Label htmlFor="from-currency">From</Label>
                  <Select
                    value={formData.from_currency}
                    onValueChange={(value: string) =>
                      setFormData((prev: CurrencyConversionRequest) => ({
                        ...prev,
                        from_currency: value as any
                      }))
                    }
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger id="from-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: CurrencyInfo) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{currency.code}</span>
                            <span className="text-sm text-gray-500">
                              {currency.symbol} {currency.name}
                            </span>
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
                    onClick={handleSwapCurrencies}
                    className="rounded-full"
                    disabled={isLoadingCurrencies}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>
                </div>

                {/* To Currency */}
                <div className="space-y-2">
                  <Label htmlFor="to-currency">To</Label>
                  <Select
                    value={formData.to_currency}
                    onValueChange={(value: string) =>
                      setFormData((prev: CurrencyConversionRequest) => ({
                        ...prev,
                        to_currency: value as any
                      }))
                    }
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger id="to-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: CurrencyInfo) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{currency.code}</span>
                            <span className="text-sm text-gray-500">
                              {currency.symbol} {currency.name}
                            </span>
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
                className="w-full" 
                disabled={isLoading || isLoadingCurrencies || formData.amount <= 0}
                size="lg"
              >
                {isLoading ? 'Converting...' : 'Convert Currency'}
              </Button>
            </form>

            {/* Conversion Result */}
            {conversionResult && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Conversion Result</h3>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">From</div>
                          <div className="text-xl font-bold">
                            {getFromCurrencyInfo()?.symbol}{conversionResult.original_amount.toFixed(2)}
                          </div>
                          <div className="text-sm font-mono text-gray-500">
                            {conversionResult.from_currency}
                          </div>
                        </div>
                        
                        <ArrowRightLeft className="w-6 h-6 text-green-600" />
                        
                        <div className="text-left">
                          <div className="text-sm text-gray-600">To</div>
                          <div className="text-xl font-bold text-green-700">
                            {getToCurrencyInfo()?.symbol}{conversionResult.converted_amount.toFixed(2)}
                          </div>
                          <div className="text-sm font-mono text-gray-500">
                            {conversionResult.to_currency}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Badge variant="secondary" className="text-sm">
                          Rate: 1 {conversionResult.from_currency} = {conversionResult.exchange_rate.toFixed(4)} {conversionResult.to_currency}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Conversion date: {conversionResult.conversion_date.toLocaleDateString()} {conversionResult.conversion_date.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Loading State for Initial Currencies */}
            {isLoadingCurrencies && (
              <div className="text-center text-gray-500">
                Loading currencies...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Exchange rates are fetched in real-time</p>
          <p className="mt-1">💡 Note: This demo uses placeholder data from the backend</p>
        </div>
      </div>
    </div>
  );
}

export default App;
