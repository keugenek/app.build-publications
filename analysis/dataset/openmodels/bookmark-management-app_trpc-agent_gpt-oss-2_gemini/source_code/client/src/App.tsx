import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User } from '../../server/src/schema';
import { AuthForm } from '@/components/AuthForm';
import { BookmarkManager } from '@/components/BookmarkManager';

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = useCallback((loggedUser: User) => {
    setUser(loggedUser);
  }, []);

  // Simple healthcheck on mount (optional)
  useEffect(() => {
    trpc.healthcheck.query().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookmark Manager</h1>
        {user && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => setUser(null)}
            >
              Log out
            </button>
          </div>
        )}
      </header>
      {user ? (
        <BookmarkManager />
      ) : (
        <AuthForm onAuthSuccess={handleLogin} />
      )}
    </div>
  );
}

export default App;
