import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CurrencyConversionInput, CurrencyConversionResult, SupportedCurrencies } from '../../../server/src/schema';

interface CurrencyConverterProps {
  supportedCurrencies: SupportedCurrencies;
  onConversionComplete?: () => void;
}

export function CurrencyConverter({ supportedCurrencies, onConversionComplete }: CurrencyConverterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CurrencyConversionResult | null>(null);
  const [error, setError] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CurrencyConversionInput>({
    amount: 100,
    from_currency: 'USD',
    to_currency: 'EUR'
  });

  // Handle form submission
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const conversionResult = await trpc.convertCurrency.mutate(formData);
      setResult(conversionResult);
      onConversionComplete?.();
    } catch (error) {
      console.error('Failed to convert currency:', error);
      setError('Failed to convert currency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFormData((prev: CurrencyConversionInput) => ({
      ...prev,
      from_currency: prev.to_currency,
      to_currency: prev.from_currency
    }));
  };

  // Get currency name by code
  const getCurrencyName = (code: string) => {
    const currency = supportedCurrencies.find(c => c.code === code);
    return currency ? currency.name : code;
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-center">💱 Convert Your Money</CardTitle>
        <CardDescription className="text-center">
          Enter an amount and select currencies to see the conversion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleConvert} className="space-y-6">
          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CurrencyConversionInput) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))
              }
              placeholder="Enter amount"
              step="0.01"
              min="0.01"
              required
              className="text-lg h-12"
            />
          </div>

          {/* Currency selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* From currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">From</Label>
              <Select
                value={formData.from_currency || 'USD'}
                onValueChange={(value: string) =>
                  setFormData((prev: CurrencyConversionInput) => ({
                    ...prev,
                    from_currency: value
                  }))
                }
              >
                <SelectTrigger className="h-12">
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

            {/* Swap button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSwapCurrencies}
                className="h-12 w-12 rounded-full currency-swap-btn"
                title="Swap currencies"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* To currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">To</Label>
              <Select
                value={formData.to_currency || 'EUR'}
                onValueChange={(value: string) =>
                  setFormData((prev: CurrencyConversionInput) => ({
                    ...prev,
                    to_currency: value
                  }))
                }
              >
                <SelectTrigger className="h-12">
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
          </div>

          {/* Convert button */}
          <Button
            type="submit"
            disabled={isLoading || formData.from_currency === formData.to_currency}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Converting...
              </div>
            ) : (
              '🔄 Convert Currency'
            )}
          </Button>
        </form>

        {/* Error message */}
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Conversion result */}
        {result && (
          <div className="mt-6 result-card">
            <Separator className="mb-4" />
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-center space-y-4">
                {/* Original amount */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">You convert</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.amount.toFixed(2)} {result.from_currency}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getCurrencyName(result.from_currency)}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-green-600" />
                </div>

                {/* Converted amount */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">You get</p>
                  <p className="text-3xl font-bold text-green-600">
                    {result.converted_amount.toFixed(2)} {result.to_currency}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getCurrencyName(result.to_currency)}
                  </p>
                </div>

                {/* Exchange rate info */}
                <div className="pt-4 border-t border-green-200">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Exchange Rate:</strong> 1 {result.from_currency} = {result.exchange_rate.toFixed(4)} {result.to_currency}
                    </p>
                    <p>
                      <strong>Conversion Date:</strong> {result.conversion_date.toLocaleDateString()} at {result.conversion_date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
