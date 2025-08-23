// import { Table } from '@/components/ui/table'; from '@/components/ui/table';
import type { Log } from '../../../server/src/schema';
import { format } from 'date-fns';

/**
 * Simple table to display logs.
 */
export function LogList({ logs }: { logs: Log[] }) {
  if (logs.length === 0) {
    return <p className="text-gray-500">No logs recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sleep (h)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work (h)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Social (h)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Screen (h)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Emotion</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(log.date), 'PPP')}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.sleep_duration}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.work_hours}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.social_time}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.screen_time}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.emotional_energy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
