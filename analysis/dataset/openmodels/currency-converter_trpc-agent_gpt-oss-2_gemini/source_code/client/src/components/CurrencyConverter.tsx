import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';


// Import runtime enum for options and type‑only currency type
import { currencyEnum } from '../../../server/src/schema';
import type { Currency, ConvertInput, ConvertOutput } from '../../../server/src/schema';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState<Currency>('USD');
  const [to, setTo] = useState<Currency>('EUR');
  const [result, setResult] = useState<ConvertOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const currencies = currencyEnum.options as Currency[]; // Zod enum values

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const input: ConvertInput = {
      amount: parseFloat(amount),
      from,
      to,
    };
    setLoading(true);
    try {
      const data = await trpc.convert.mutate(input);
      setResult(data);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formattedResult = () => {
    if (!result) return null;
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: result.to,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
    return formatter.format(result.convertedAmount);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Currency Converter</h2>
      <form onSubmit={handleConvert} className="space-y-4">
        <Input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="any"
          min="0"
          required
        />
        <div className="flex space-x-2">
          {/* From Currency */}
          <Select value={from} onValueChange={(v) => setFrom(v as Currency)}>
            <SelectTrigger className="flex-1" size="default">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* To Currency */}
          <Select value={to} onValueChange={(v) => setTo(v as Currency)}>
            <SelectTrigger className="flex-1" size="default">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Converting…' : 'Convert'}
        </Button>
      </form>
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-center">
          <p className="text-sm text-gray-600">{result.amount} {result.from} =</p>
          <p className="text-2xl font-bold mt-1">{formattedResult()}</p>
        </div>
      )}
    </div>
  );
}
