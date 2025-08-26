import './App.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { ConvertCurrencyInput, ConvertCurrencyOutput } from '../../server/src/schema';
import type { Conversion } from '../../server/src/db/schema';
import { currencyEnum } from '../../server/src/schema';

function App() {
  // Form state
  const [formData, setFormData] = useState<ConvertCurrencyInput>({
    amount: 0,
    source_currency: 'USD',
    target_currency: 'EUR',
  });

  const [result, setResult] = useState<ConvertCurrencyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Conversion history
  const [history, setHistory] = useState<ConvertCurrencyOutput[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await trpc.getConversions.query();
      // Map DB records to the output shape
      const mapped = (data as Conversion[]).map<ConvertCurrencyOutput>((c) => ({
        amount: Number(c.amount),
        source_currency: c.source_currency as typeof currencyEnum[number],
        target_currency: c.target_currency as typeof currencyEnum[number],
        converted_amount: Number(c.converted_amount),
        rate: Number(c.rate),
        timestamp: c.created_at,
      }));
      setHistory(mapped);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const conversion = await trpc.convertCurrency.mutate(formData);
      setResult(conversion);
      await loadHistory();
    } catch (error) {
      console.error('Conversion error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currencyOptions = currencyEnum;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Currency Converter</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={formData.amount === 0 ? '' : formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
            }
            placeholder="Enter amount"
            required
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
              From
            </label>
            <select
              id="source"
              className="w-full border rounded px-2 py-1"
              value={formData.source_currency}
              onChange={(e) => setFormData((prev) => ({ ...prev, source_currency: e.target.value as typeof currencyEnum[number] }))}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target">
              To
            </label>
            <select
              id="target"
              className="w-full border rounded px-2 py-1"
              value={formData.target_currency}
              onChange={(e) => setFormData((prev) => ({ ...prev, target_currency: e.target.value as typeof currencyEnum[number] }))}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Converting...' : 'Convert'}
        </Button>
      </form>

      {result && (
        <div className="bg-white shadow-md rounded px-6 py-4 mb-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <p>
            {result.amount} {result.source_currency} ={' '}
            {result.converted_amount.toFixed(2)} {result.target_currency}
          </p>
          <p className="text-sm text-gray-500">
            Rate: {result.rate.toFixed(4)} (at {new Date(result.timestamp).toLocaleTimeString()})
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white shadow-md rounded px-6 py-4 w-full max-w-lg">
          <h2 className="text-xl font-semibold mb-2">Conversion History</h2>
          <ul className="space-y-2">
            {history.map((h, idx) => (
              <li key={idx} className="border-b pb-2">
                {h.amount} {h.source_currency} → {h.converted_amount.toFixed(2)} {h.target_currency} (Rate: {h.rate.toFixed(4)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
