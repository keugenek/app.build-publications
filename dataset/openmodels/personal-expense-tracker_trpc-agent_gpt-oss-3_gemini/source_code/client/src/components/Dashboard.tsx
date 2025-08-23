// Dashboard component showing summary of transactions and budgets
import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Transaction, Category, Budget } from '../../../server/src/schema';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';


export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [txs, cats, bud] = await Promise.all([
        trpc.getTransactions.query(),
        trpc.getCategories.query(),
        trpc.getBudgets.query(),
      ]);
      setTransactions(txs);
      setCategories(cats);
      setBudgets(bud);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Map budgets per category
  const budgetMap = new Map<number, number>(); // category_id -> amount
  budgets.forEach((b) => budgetMap.set(b.category_id, b.amount));

  // Spending per category
  const spendByCategory = categories.map((cat) => {
    const spent = transactions
      .filter((t) => t.category_id === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const budget = budgetMap.get(cat.id) ?? 0;
    return { ...cat, spent, budget };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Total Income</h2>
          <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Total Expenses</h2>
          <p className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-medium mb-4">Spending by Category</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spendByCategory.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right">${c.spent.toFixed(2)}</TableCell>
                <TableCell className="text-right">${c.budget.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${c.spent > c.budget ? 'text-red-600' : 'text-green-600'}`}>
                  ${(c.budget - c.spent).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
