import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CurrencyConversionResult, GetConversionHistoryInput } from '../../../server/src/schema';

interface ConversionHistoryProps {
  className?: string;
}

export function ConversionHistory({ className = '' }: ConversionHistoryProps) {
  const [conversions, setConversions] = useState<CurrencyConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    const historyParams: GetConversionHistoryInput = {
      limit: 10,
      offset: 0
    };
    
    try {
      const history = await trpc.getConversionHistory.query(historyParams);
      setConversions(history);
    } catch (error) {
      console.error('Failed to load conversion history:', error);
      setError('Failed to load conversion history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = () => {
    loadHistory();
  };

  return (
    <Card className={`${className} bg-white/80 backdrop-blur-sm`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Recent Conversions</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Your recent currency conversion history
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : conversions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No conversions yet</p>
            <p className="text-sm">Your conversion history will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {conversions.map((conversion: CurrencyConversionResult, index: number) => (
                <div key={conversion.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {conversion.from_currency}
                        </Badge>
                        <span className="text-sm text-gray-400">→</span>
                        <Badge variant="outline" className="text-xs">
                          {conversion.to_currency}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {conversion.amount.toFixed(2)} {conversion.from_currency}
                          </p>
                          <p className="text-sm text-gray-600">
                            Rate: {conversion.exchange_rate.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {conversion.converted_amount.toFixed(2)} {conversion.to_currency}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversion.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < conversions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
