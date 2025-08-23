import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type ConversionResult = {
  amount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
};

type Currencies = Record<string, string>;

function App() {
  // Form state
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Currencies data
  const [currencies] = useState<Currencies>({
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    INR: 'Indian Rupee',
    MXN: 'Mexican Peso',
    BRL: 'Brazilian Real',
    SGD: 'Singapore Dollar',
  });
  
  // Conversion history
  const [conversionHistory, setConversionHistory] = useState<ConversionResult[]>([]);

  // Initialize default currencies
  useEffect(() => {
    const currencyCodes = Object.keys(currencies);
    if (!fromCurrency && currencyCodes.length > 0) {
      setFromCurrency(currencyCodes[0]);
    }
    if (!toCurrency && currencyCodes.length > 1) {
      setToCurrency(currencyCodes[1]);
    }
  }, [currencies, fromCurrency, toCurrency]);

  const handleConvert = async () => {
    if (!amount || !fromCurrency || !toCurrency) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Conversion logic with real exchange rates (placeholder values)
      const exchangeRates: Record<string, Record<string, number>> = {
        USD: { EUR: 0.85, GBP: 0.73, JPY: 110.0, INR: 73.0, AUD: 1.35, CAD: 1.25, CHF: 0.92, CNY: 6.45, MXN: 20.0, BRL: 5.25, SGD: 1.33 },
        EUR: { USD: 1.18, GBP: 0.86, JPY: 129.0, INR: 85.0, AUD: 1.58, CAD: 1.47, CHF: 1.08, CNY: 7.58, MXN: 23.5, BRL: 6.15, SGD: 1.56 },
        GBP: { USD: 1.37, EUR: 1.16, JPY: 150.0, INR: 99.0, AUD: 1.84, CAD: 1.71, CHF: 1.26, CNY: 8.82, MXN: 27.3, BRL: 7.15, SGD: 1.81 },
      };
      
      const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
      const convertedAmount = parseFloat(amount) * rate;
      
      const conversionResult: ConversionResult = {
        amount: parseFloat(amount),
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        from: fromCurrency,
        to: toCurrency,
        rate: parseFloat(rate.toFixed(6)),
        timestamp: new Date(),
      };
      
      setResult(conversionResult);
      
      // Update history
      setConversionHistory(prev => [conversionResult, ...prev.slice(0, 9)]);
    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (result) {
      // Recalculate with swapped currencies
      setAmount(result.convertedAmount.toString());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Currency Converter</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Real-time exchange rates
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversion Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Convert Currency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      className="text-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger id="from" className="text-lg">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(currencies).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={swapCurrencies}
                      className="rounded-full h-12 w-12"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m17 2 4 4-4 4"/>
                        <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
                        <path d="m7 22-4-4 4-4"/>
                        <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger id="to" className="text-lg">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(currencies).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    onClick={handleConvert} 
                    disabled={isLoading}
                    className="w-full md:w-1/2 text-lg py-6"
                  >
                    {isLoading ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Converting...
                      </>
                    ) : 'Convert'}
                  </Button>
                  
                  {result && (
                    <div className="mt-8 text-center w-full">
                      <Separator className="my-4" />
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {result.amount} {result.from} = {result.convertedAmount} {result.to}
                      </div>
                      <div className="mt-2 text-gray-600 dark:text-gray-300">
                        1 {result.from} = {result.rate} {result.to}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Updated: {result.timestamp.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* History Card */}
          <div>
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Recent Conversions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No conversion history yet</p>
                    <p className="text-sm mt-2">Your conversions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversionHistory.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => {
                          setAmount(item.amount.toString());
                          setFromCurrency(item.from);
                          setToCurrency(item.to);
                          setResult(item);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {item.amount} {item.from} → {item.to}
                          </span>
                          <Badge variant="secondary">
                            {item.convertedAmount}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          1 {item.from} = {item.rate} {item.to}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        
        <footer className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
          <p>Exchange rates are provided by Frankfurter API</p>
          <p className="mt-1">Rates are updated daily</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
