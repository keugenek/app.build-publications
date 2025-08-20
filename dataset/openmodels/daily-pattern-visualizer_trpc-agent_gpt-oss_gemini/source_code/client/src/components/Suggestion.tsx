// Suggestion component provides simple break suggestions based on work hours
import type { DailyLog } from '../../../server/src/schema';
import { useMemo } from 'react';

interface SuggestionProps {
  logs: DailyLog[];
}

export function Suggestion({ logs }: SuggestionProps) {
  // Compute average work hours and check if any day exceeds 8 hours
  const { avgWork, overworkDays } = useMemo(() => {
    if (logs.length === 0) return { avgWork: 0, overworkDays: 0 };
    const total = logs.reduce((sum, log) => sum + log.work_hours, 0);
    const avg = total / logs.length;
    const over = logs.filter((log) => log.work_hours > 8).length;
    return { avgWork: avg, overworkDays: over };
  }, [logs]);

  if (logs.length === 0) {
    return <p className="text-gray-500">No data to generate suggestions yet.</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
      <p className="mb-2">
        Your average work time is{' '}
        <span className="font-medium">{avgWork.toFixed(1)} hours</span> per day.
      </p>
      {overworkDays > 0 ? (
        <p className="text-red-600 font-medium">
          You worked more than 8 hours on {overworkDays} day{overworkDays > 1 ? 's' : ''}. Consider taking a short break or reducing work time.
        </p>
      ) : (
        <p className="text-green-600 font-medium">Great job keeping work hours within a healthy range!</p>
      )}
    </div>
  );
}
