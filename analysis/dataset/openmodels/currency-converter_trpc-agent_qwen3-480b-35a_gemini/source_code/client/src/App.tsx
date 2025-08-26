import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CurrencyConverterForm } from '@/components/CurrencyConverterForm';
import { trpc } from '@/utils/trpc';
import type { Currency, ConversionResult, ConversionHistory } from '../../server/src/schema';

function App() {
  // State for currencies and conversion
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isBackendError, setIsBackendError] = useState<boolean>(false);

  // Fetch available currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const data = await trpc.getCurrencies.query();
      setCurrencies(data);
      setIsBackendError(false);
      // Set default currencies if not already set
      if (data.length > 0) {
        if (!fromCurrency) setFromCurrency(data[0].code);
        if (!toCurrency && data.length > 1) setToCurrency(data[1].code);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setIsBackendError(true);
      setError('Unable to connect to the currency service. Please try again later.');
    }
  }, [fromCurrency, toCurrency]);

  // Fetch conversion history
  const fetchHistory = useCallback(async () => {
    try {
      const data = await trpc.getConversionHistory.query();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      // Don't set error here as it's less critical
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchCurrencies();
    fetchHistory();
  }, [fetchCurrencies, fetchHistory]);

  // Handle conversion result
  const handleResult = (conversionResult: ConversionResult) => {
    setResult(conversionResult);
    // Refresh history after conversion
    fetchHistory();
  };

  // Format currency amount
  const formatAmount = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      // Fallback if currency code is invalid
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Currency Converter</h1>
        <p className="text-muted-foreground">Real-time exchange rates at your fingertips</p>
      </div>

      {isBackendError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The currency conversion service is currently unavailable. This demo shows the UI functionality.
            In a production environment, this would connect to the Frankfurter API for real exchange rates.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Card */}
        <div className="lg:col-span-2">
          <CurrencyConverterForm
            currencies={currencies}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            onFromCurrencyChange={setFromCurrency}
            onToCurrencyChange={setToCurrency}
            onResult={handleResult}
            onError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          
          {error && !isBackendError && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-center">
              {error}
            </div>
          )}
          
          {result && (
            <div className="mt-6 p-4 bg-secondary rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">
                {formatAmount(result.amount, result.fromCurrency)} = {formatAmount(result.convertedAmount, result.toCurrency)}
              </div>
              <div className="text-muted-foreground">
                Exchange rate: 1 {result.fromCurrency} = {result.exchangeRate.toFixed(6)} {result.toCurrency}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Last updated: {result.timestamp.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        {/* History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>Your conversion history</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {isBackendError 
                    ? "History not available in demo mode" 
                    : "No conversion history yet"}
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {formatAmount(item.amount, item.fromCurrency)} → {formatAmount(item.convertedAmount, item.toCurrency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {item.exchangeRate.toFixed(4)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Exchange rates are provided by the Frankfurter API</p>
      </div>
    </div>
  );
}

export default App;
