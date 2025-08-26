import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { StockTransaction } from '../../../server/src/schema';
import { Card } from '@/components/ui/card';

export function TransactionList() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpc.getStockTransactions.query();
      setTransactions(data);
    } catch (e) {
      console.error('Error fetching transactions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Stock Transactions</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">No transactions recorded.</p>
      ) : (
        <div className="grid gap-4">
          {transactions.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {t.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                </span>
                <span className="text-sm text-muted-foreground">
                  Product ID: {t.product_id}
                </span>
                <span className="text-sm">Quantity: {t.quantity}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
