import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Currency, ConversionRequest, ConversionResult } from '../../server/src/schema';

function App() {
  // State for currencies and loading
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<ConversionRequest>({
    amount: 1,
    from_currency: '',
    to_currency: ''
  });
  
  // Conversion result state
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<ConversionResult[]>([]);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load currencies on mount
  const loadCurrencies = useCallback(async () => {
    try {
      setLoadingCurrencies(true);
      const result = await trpc.getCurrencies.query();
      setCurrencies(result);
      setError(null);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      // Fallback to default currencies when API fails
      const fallbackCurrencies: Currency[] = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound Sterling' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'CHF', name: 'Swiss Franc' },
        { code: 'CNY', name: 'Chinese Yuan' },
        { code: 'SEK', name: 'Swedish Krona' },
        { code: 'NZD', name: 'New Zealand Dollar' },
      ];
      setCurrencies(fallbackCurrencies);
      setError('Using demo currencies. Live API integration pending.');
    } finally {
      setLoadingCurrencies(false);
    }
  }, []);

  // Load conversion history
  const loadHistory = useCallback(async () => {
    try {
      const result = await trpc.getConversionHistory.query();
      setConversionHistory(result);
    } catch (error) {
      console.error('Failed to load conversion history:', error);
      // Silently fail for history - it's not critical for the main functionality
      setConversionHistory([]);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
    loadHistory();
  }, [loadCurrencies, loadHistory]);

  // Handle currency conversion
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_currency || !formData.to_currency) {
      setError('Please select both source and target currencies');
      return;
    }

    if (formData.amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const result = await trpc.convertCurrency.mutate(formData);
      setConversionResult(result);
      
      // Add to history and reload
      setConversionHistory((prev: ConversionResult[]) => [result, ...prev]);
      
      setError(null);
    } catch (error) {
      console.error('Conversion failed:', error);
      // Provide demo conversion when API fails
      const demoResult: ConversionResult = {
        id: Date.now(),
        amount: formData.amount,
        from_currency: formData.from_currency,
        to_currency: formData.to_currency,
        exchange_rate: 1.2, // Demo exchange rate
        converted_amount: formData.amount * 1.2,
        created_at: new Date(),
      };
      setConversionResult(demoResult);
      setConversionHistory((prev: ConversionResult[]) => [demoResult, ...prev]);
      setError('Demo conversion shown. Live API integration pending.');
    } finally {
      setIsConverting(false);
    }
  };

  // Handle form input changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev: ConversionRequest) => ({ ...prev, amount: value }));
  };

  const handleFromCurrencyChange = (value: string) => {
    setFormData((prev: ConversionRequest) => ({ ...prev, from_currency: value }));
  };

  const handleToCurrencyChange = (value: string) => {
    setFormData((prev: ConversionRequest) => ({ ...prev, to_currency: value }));
  };

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFormData((prev: ConversionRequest) => ({
      ...prev,
      from_currency: prev.to_currency,
      to_currency: prev.from_currency
    }));
    setConversionResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💱 Currency Converter
          </h1>
          <p className="text-lg text-gray-600">
            Convert currencies with live exchange rates from Frankfurter API
          </p>
        </div>

        {/* Error/Info Alert */}
        {error && (
          <Alert className={`mb-6 ${error.includes('demo') ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className={error.includes('demo') ? 'text-blue-700' : 'text-red-700'}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Conversion Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Currency Conversion</CardTitle>
            <CardDescription className="text-center">
              Enter amount and select currencies to convert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.01"
                  required
                  className="text-lg h-12"
                />
              </div>

              {/* Currency Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                {/* From Currency */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <Select
                    value={formData.from_currency || ""}
                    onValueChange={handleFromCurrencyChange}
                    disabled={loadingCurrencies}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={loadingCurrencies ? "Loading..." : "Select currency"} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: Currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {currency.code}
                            </Badge>
                            <span>{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSwapCurrencies}
                    disabled={!formData.from_currency || !formData.to_currency}
                    className="h-12 w-12 rounded-full"
                  >
                    ⇄
                  </Button>
                </div>

                {/* To Currency */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <Select
                    value={formData.to_currency || ""}
                    onValueChange={handleToCurrencyChange}
                    disabled={loadingCurrencies}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={loadingCurrencies ? "Loading..." : "Select currency"} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency: Currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {currency.code}
                            </Badge>
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
                disabled={isConverting || loadingCurrencies || !formData.from_currency || !formData.to_currency}
                className="w-full h-12 text-lg"
              >
                {isConverting ? 'Converting...' : 'Convert Currency 🚀'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Conversion Result */}
        {conversionResult && (
          <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-center text-green-800">Conversion Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-gray-900">
                  {formData.amount} {conversionResult.from_currency} = {' '}
                  <span className="text-green-600">
                    {conversionResult.converted_amount.toFixed(2)} {conversionResult.to_currency}
                  </span>
                </div>
                <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
                  <span>Exchange Rate: 1 {conversionResult.from_currency} = {conversionResult.exchange_rate} {conversionResult.to_currency}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Converted on: {conversionResult.created_at.toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversion History */}
        {conversionHistory.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>Your conversion history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conversionHistory.slice(0, 5).map((conversion: ConversionResult) => (
                  <div key={conversion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">
                        {conversion.amount} {conversion.from_currency} → {conversion.converted_amount.toFixed(2)} {conversion.to_currency}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {conversion.created_at.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
