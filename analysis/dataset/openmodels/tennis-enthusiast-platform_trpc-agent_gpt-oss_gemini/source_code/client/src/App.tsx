import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { User, SearchPlayersInput } from '../../server/src/schema';
import { UserForm } from '@/components/UserForm';
import { UserList } from '@/components/UserList';
import { SearchForm } from '@/components/SearchForm';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getUsers.query();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = async (criteria: SearchPlayersInput) => {
    setIsLoading(true);
    try {
      const results = await trpc.searchPlayers.query(criteria);
      setUsers(results);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <header className="max-w-2xl w-full mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Tennis Matchmaker</h1>
        <p className="text-center text-gray-600 mt-2">
          Find partners, chat, and schedule matches.
        </p>
      </header>
      <section className="max-w-2xl w-full space-y-6">
        <UserForm onUserCreated={handleUserCreated} />
        <SearchForm onSearch={handleSearch} />
        <UserList users={users} isLoading={isLoading} />
      </section>
      <footer className="mt-8 text-sm text-gray-500">
        Built with ❤️ using tRPC, Radix UI, and Tailwind CSS.
      </footer>
    </div>
  );
}

export default App;
