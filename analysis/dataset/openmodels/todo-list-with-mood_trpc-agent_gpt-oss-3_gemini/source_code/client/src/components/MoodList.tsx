import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { MoodEntry } from '../../../server/src/schema';

interface MoodListProps {
  entries: MoodEntry[];
}

export function MoodList({ entries }: MoodListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Placeholder delete handler (no backend implementation)
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    // Simulate async delete
    await new Promise((res) => setTimeout(res, 300));
    // In a real app, you'd call a mutation and refresh list.
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-4 flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{new Date(entry.date).toLocaleDateString()}</span>
            <Badge variant="secondary" className="text-sm">
              Rating: {entry.rating}
            </Badge>
          </div>
          {entry.note && (
            <p className="text-gray-700">{entry.note}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(entry.id)}
            disabled={deletingId === entry.id}
          >
            {deletingId === entry.id ? 'Deleting...' : 'Delete'}
          </Button>
        </Card>
      ))}
    </div>
  );
}
