import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { ConvertCurrencyInput } from '../../../server/src/schema';
import type { Currency } from '../../../server/src/schema';
import type { CurrencyConversionResult } from '../../../server/src/schema';

interface CurrencyConverterProps {
  onSwap?: () => void;
  initialAmount?: string;
  initialFromCurrency?: string;
  initialToCurrency?: string;
}

export function CurrencyConverter({ 
  onSwap,
  initialAmount = '1',
  initialFromCurrency = 'USD',
  initialToCurrency = 'EUR'
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>(initialAmount);
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(initialToCurrency);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [result, setResult] = useState<CurrencyConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load available currencies on mount
  const loadCurrencies = useCallback(async () => {
    try {
      const data = await trpc.getCurrencies.query();
      setCurrencies(data);
    } catch (err) {
      console.error('Failed to load currencies:', err);
      setError('Failed to load currencies. Please try again later.');
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const input: ConvertCurrencyInput = {
        amount: parseFloat(amount),
        from: fromCurrency,
        to: toCurrency
      };
      
      const conversionResult = await trpc.convertCurrency.mutate(input);
      setResult(conversionResult);
    } catch (err) {
      console.error('Conversion error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to convert currency. Please try again.');
      } else {
        setError('Failed to convert currency. Please try again.');
      }
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (onSwap) onSwap();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="Enter amount"
            required
            className="text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fromCurrency" className="text-sm font-medium">
              From
            </label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="toCurrency" className="text-sm font-medium">
              To
            </label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwap}
            className="rounded-full"
            aria-label="Swap currencies"
          >
            ⇄ Swap
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm py-2 text-center">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Converting...' : 'Convert'}
        </Button>
      </form>

      {result && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {result.amount} {result.from} = {result.convertedAmount} {result.to}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Exchange rate: 1 {result.from} = {result.exchangeRate} {result.to}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {result.timestamp.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-500">
        <p>Powered by Frankfurter API</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">Real-time rates</Badge>
          <Badge variant="secondary">156 currencies</Badge>
        </div>
      </div>
    </div>
  );
}
