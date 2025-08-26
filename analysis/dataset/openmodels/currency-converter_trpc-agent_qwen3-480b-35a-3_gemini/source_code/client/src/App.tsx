import './App.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyConverter } from '@/components/CurrencyConverter';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Currency Converter</CardTitle>
          <CardDescription>
            Convert between currencies using real-time exchange rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyConverter />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
