import './App.css';
import { CategoryForm } from '@/components/CategoryForm';
import { TransactionForm } from '@/components/TransactionForm';
import { Dashboard } from '@/components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Expense Tracker</h1>
        <p className="text-gray-600">Track your income, expenses, budgets and categories</p>
      </header>
      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <section className="md:col-span-2 lg:col-span-1">
          <CategoryForm />
        </section>
        <section className="md:col-span-2 lg:col-span-1">
          <TransactionForm />
        </section>
        <section className="col-span-full">
          <Dashboard />
        </section>
      </main>
    </div>
  );
}

export default App;
