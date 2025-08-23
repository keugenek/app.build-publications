import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { User, SearchUsersInput } from '../../../server/src/schema';

export function UserSearch() {
  const [filters, setFilters] = useState<SearchUsersInput>({
    location: '',
    skill_level: '',
  });
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Trim empty strings to undefined so they are omitted
      const payload: SearchUsersInput = {
        location: filters.location?.trim() || undefined,
        skill_level: filters.skill_level?.trim() || undefined,
      } ;
      const users = await trpc.searchUsers.query(payload);
      setResults(users as User[]);
    } catch (err) {
      console.error('Search failed', err);
      setError('Unable to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center text-rose-800 dark:text-rose-200">
        Find Players
      </h2>
      <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-6">
        <Input
          placeholder="Location (city or neighborhood)"
          value={filters.location}
          onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
        />
        <Input
          placeholder="Skill level (e.g., Beginner, Intermediate)"
          value={filters.skill_level}
          onChange={(e) => setFilters((prev) => ({ ...prev, skill_level: e.target.value }))}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>
      {error && <p className="text-red-600 text-center mb-2">{error}</p>}
      {results.length === 0 ? (
        <p className="text-center text-gray-500">No players found. Try different filters.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((user) => (
            <li
              key={user.id}
              className="p-4 border rounded-md bg-rose-50 dark:bg-gray-700"
            >
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-300">{user.name}</h3>
              <p className="text-sm text-rose-600 dark:text-rose-200">Skill: {user.skill_level}</p>
              <p className="text-sm text-rose-600 dark:text-rose-200">Location: {user.location}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
