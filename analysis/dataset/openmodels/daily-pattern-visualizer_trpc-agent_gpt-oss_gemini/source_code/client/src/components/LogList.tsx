// LogList component to display daily logs in a table
import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { DailyLog } from '../../../server/src/schema';

export function LogList({ refreshFlag }: { refreshFlag: boolean }) {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const loadLogs = useCallback(async () => {
    try {
      const fetched = await trpc.getDailyLogs.query();
      // Ensure dates are Date objects (superjson should handle)
      setLogs(fetched);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs, refreshFlag]);

  if (logs.length === 0) {
    return <p className="text-gray-500">No logs yet. Add one above.</p>;
  }

  return (
    <div className="overflow-x-auto mt-8">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Sleep (h)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Work (h)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Social (h)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Screen (h)</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Energy</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-2 text-sm text-gray-700">
                {new Date(log.logged_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">{log.sleep_hours}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{log.work_hours}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{log.social_hours}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{log.screen_hours}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{log.emotional_energy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
