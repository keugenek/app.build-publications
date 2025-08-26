import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Currency, ConversionResult } from '../../../server/src/schema';
import { trpc } from '@/utils/trpc';

interface CurrencyConverterFormProps {
  currencies: Currency[];
  fromCurrency: string;
  toCurrency: string;
  onFromCurrencyChange: (value: string) => void;
  onToCurrencyChange: (value: string) => void;
  onResult: (result: ConversionResult) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CurrencyConverterForm({
  currencies,
  fromCurrency,
  toCurrency,
  onFromCurrencyChange,
  onToCurrencyChange,
  onResult,
  onError,
  isLoading,
  setIsLoading
}: CurrencyConverterFormProps) {
  const [amount, setAmount] = useState<string>('1');

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError('');

    try {
      const conversionResult = await trpc.convertCurrency.mutate({
        amount: parseFloat(amount),
        fromCurrency,
        toCurrency
      });

      onResult(conversionResult);
    } catch (err) {
      console.error('Conversion failed:', err);
      onError('Conversion failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    onFromCurrencyChange(toCurrency);
    onToCurrencyChange(temp);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Conversion</CardTitle>
        <CardDescription>Enter amount and select currencies to convert</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleConvert} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="amount" className="text-sm font-medium">Amount</label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="md:col-span-1">
              <label htmlFor="fromCurrency" className="text-sm font-medium">From</label>
              <Select 
                value={fromCurrency} 
                onValueChange={onFromCurrencyChange}
              >
                <SelectTrigger id="fromCurrency">
                  <SelectValue />
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
            
            <div className="md:col-span-1">
              <label htmlFor="toCurrency" className="text-sm font-medium">To</label>
              <Select 
                value={toCurrency} 
                onValueChange={onToCurrencyChange}
              >
                <SelectTrigger id="toCurrency">
                  <SelectValue />
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
          
          <div className="flex flex-col items-center gap-4">
            <Button 
              type="submit" 
              disabled={isLoading || currencies.length === 0}
              className="w-full md:w-auto"
            >
              {isLoading ? 'Converting...' : 'Convert'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={swapCurrencies}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              Swap Currencies
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
