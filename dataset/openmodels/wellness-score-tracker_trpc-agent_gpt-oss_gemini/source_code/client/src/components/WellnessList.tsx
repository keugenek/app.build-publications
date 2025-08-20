import { useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessListProps {
  entries: WellnessEntry[];
}

export function WellnessList({ entries }: WellnessListProps) {
  // Sort entries by date descending
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const dateA = new Date(a.entry_date).getTime();
      const dateB = new Date(b.entry_date).getTime();
      return dateB - dateA;
    });
  }, [entries]);

  if (sortedEntries.length === 0) {
    return <p className="text-gray-500 text-center">No wellness entries yet. Add one above!</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-2">Historical Wellness Scores</h2>
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Sleep (h)</TableHead>
            <TableHead>Stress</TableHead>
            <TableHead>Caffeine (mg)</TableHead>
            <TableHead>Alcohol (units)</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
              <TableCell>{entry.sleep_hours}</TableCell>
              <TableCell>{entry.stress_level}</TableCell>
              <TableCell>{entry.caffeine_intake}</TableCell>
              <TableCell>{entry.alcohol_intake}</TableCell>
              <TableCell className="font-bold text-green-600">{entry.wellness_score.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
