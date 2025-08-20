import './App.css';
import { LogForm } from '@/components/LogForm';
import { LogList } from '@/components/LogList';
import { Suggestion } from '@/components/Suggestion';
import { MetricsChart } from '@/components/MetricsChart';
import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { DailyLog } from '../../server/src/schema';

function App() {
  // Flag to trigger LogList reload after a new entry
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Shared logs for suggestions and chart visualisation
  const [logs, setLogs] = useState<DailyLog[]>([]);

  // Load all logs from the server
  const loadLogs = useCallback(async () => {
    try {
      const data = await trpc.getDailyLogs.query();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load logs', e);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Called after a new log is created
  const handleCreated = useCallback(() => {
    // Refresh shared logs and notify LogList to reload
    loadLogs();
    setRefreshFlag((prev) => !prev);
  }, [loadLogs]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Personal Well‑Being Dashboard</h1>
        <p className="text-gray-600">Log your daily metrics and see patterns over time.</p>
      </header>

      <section className="bg-white rounded shadow p-4 mb-8">
        <LogForm onCreated={handleCreated} />
      </section>

      <section className="bg-white rounded shadow p-4 mb-8">
        <Suggestion logs={logs} />
      </section>

      <section className="bg-white rounded shadow p-4 mb-8">
        <MetricsChart logs={logs} />
      </section>

      <section className="bg-white rounded shadow p-4">
        <LogList refreshFlag={refreshFlag} />
      </section>
    </div>
  );
}

export default App;
