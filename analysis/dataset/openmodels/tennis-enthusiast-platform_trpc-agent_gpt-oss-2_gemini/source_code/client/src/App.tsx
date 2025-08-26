import './App.css';
import { UserForm } from '@/components/UserForm';
import { UserSearch } from '@/components/UserSearch';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-rose-200 dark:from-gray-800 dark:via-gray-900 dark:to-black p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-rose-800 dark:text-rose-200">🎾 Hipster Tennis Hub</h1>
        <p className="text-lg text-rose-600 dark:text-rose-300 mt-2">
          Find fellow players, share skill levels, and connect for matches.
        </p>
      </header>
      <main className="max-w-2xl mx-auto space-y-12">
        <UserForm />
        <hr className="border-rose-300 dark:border-gray-600" />
        <UserSearch />
      </main>
      <footer className="text-center mt-12 text-sm text-rose-600 dark:text-rose-400">
        Built with ❤️ for the tennis community.
      </footer>
    </div>
  );
}

export default App;
