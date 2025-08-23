import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import type { Task } from '../../../server/src/schema';

interface TaskListProps {
  tasks: Task[];
  onUpdate: (updatedTask: Task) => void;
}

export function TaskList({ tasks, onUpdate }: TaskListProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const toggleCompleted = async (task: Task) => {
    setUpdatingId(task.id);
    // In a real app, you'd call a mutation to update the task.
    // Here we just toggle locally for demonstration.
    const updated = { ...task, completed: !task.completed } as Task;
    onUpdate(updated);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4 flex items-start space-x-4">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => toggleCompleted(task)}
            disabled={updatingId === task.id}
          />
          <div className="flex-1">
            <h3 className="text-lg font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-gray-500 mt-1">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
