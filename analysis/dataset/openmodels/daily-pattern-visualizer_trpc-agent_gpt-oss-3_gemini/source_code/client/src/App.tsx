import './App.css';

import { LogForm } from '@/components/LogForm';
import { LogList } from '@/components/LogList';
import { LogChart } from '@/components/LogChart';
import { trpc } from '@/utils/trpc';
import { useEffect, useState, useCallback } from 'react';
import type { Log } from '../../server/src/schema';

function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getLogs.query();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wellbeing Dashboard</h1>
      <LogForm onSuccess={loadLogs} />
      {isLoading ? (
        <p className="mt-4 text-gray-600">Loading logs...</p>
      ) : (
        <>
          <LogChart logs={logs} />
          <LogList logs={logs} />
        </>
      )}
    </div>
  );
}

export default App;
