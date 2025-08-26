import { useState, useEffect, useCallback } from 'react';
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../../server/src';
import superjson from 'superjson';

// Create a local TRPC client pointing to the backend server
const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: 'http://localhost:2022/trpc', transformer: superjson }),
    loggerLink({
      enabled: (opts) => typeof window !== 'undefined' || (opts.direction === 'down' && opts.result instanceof Error),
    }),
  ],
});
import { WellnessForm } from '@/components/WellnessForm';
import { WellnessList } from '@/components/WellnessList';
import type { WellnessEntry, CreateWellnessEntryInput } from '../../server/src/schema';

function App() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load entries from backend
  const loadEntries = useCallback(async () => {
    try {
      const data = await trpc.getWellnessEntries.query();
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch wellness entries:', err);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreate = async (input: CreateWellnessEntryInput) => {
    setLoading(true);
    try {
      const newEntry = await trpc.createWellnessEntry.mutate(input);
      // Append the newly created entry to the list
      setEntries((prev) => [...prev, newEntry]);
    } catch (err) {
      console.error('Failed to create wellness entry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Daily Wellness Tracker</h1>
      <section className="mb-8">
        <WellnessForm onSubmit={handleCreate} isLoading={loading} />
      </section>
      <section>
        <WellnessList entries={entries} />
      </section>
    </div>
  );
}

export default App;
