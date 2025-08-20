// MetricsChart component – placeholder visualization for daily metrics
import type { DailyLog } from '../../../server/src/schema';

interface MetricsChartProps {
  logs: DailyLog[];
}

export function MetricsChart({ logs }: MetricsChartProps) {
  // If no logs, show a placeholder message
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Metrics Over Time</h2>
        <p className="text-gray-500">No data to display yet.</p>
      </div>
    );
  }

  // Fallback visualization – simple table view of metrics
  const sorted = [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Metrics Over Time (Table View)</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Date</th>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Sleep</th>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Work</th>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Social</th>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Screen</th>
            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500">Energy</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((log) => (
            <tr key={log.id}>
              <td className="px-2 py-1 text-sm text-gray-700">{new Date(log.logged_at).toLocaleDateString()}</td>
              <td className="px-2 py-1 text-sm text-gray-700">{log.sleep_hours}</td>
              <td className="px-2 py-1 text-sm text-gray-700">{log.work_hours}</td>
              <td className="px-2 py-1 text-sm text-gray-700">{log.social_hours}</td>
              <td className="px-2 py-1 text-sm text-gray-700">{log.screen_hours}</td>
              <td className="px-2 py-1 text-sm text-gray-700">{log.emotional_energy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
