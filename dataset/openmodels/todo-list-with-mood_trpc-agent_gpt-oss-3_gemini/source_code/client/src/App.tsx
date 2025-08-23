import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { MoodForm } from '@/components/MoodForm';
import { MoodList } from '@/components/MoodList';
import { Card } from '@/components/ui/card';
import type { Task, CreateTaskInput } from '../../server/src/schema';
import type { MoodEntry, CreateMoodEntryInput } from '../../server/src/schema';

function App() {
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Mood state
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [moodsLoading, setMoodsLoading] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Load mood entries
  const loadMoods = useCallback(async () => {
    setMoodsLoading(true);
    try {
      const result = await trpc.getMoodEntries.query();
      setMoods(result);
    } catch (error) {
      console.error('Failed to load moods', error);
    } finally {
      setMoodsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadMoods();
  }, [loadTasks, loadMoods]);

  // Create task handler
  const handleCreateTask = async (data: CreateTaskInput) => {
    const created = await trpc.createTask.mutate(data);
    // Append to local list (backend placeholder returns id 0)
    setTasks((prev) => [...prev, created]);
  };

  // Create mood entry handler
  const handleCreateMood = async (data: CreateMoodEntryInput) => {
    const created = await trpc.createMoodEntry.mutate(data);
    setMoods((prev) => [...prev, created]);
  };

  // Update task (e.g., toggle completed)
  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-4">Daily Journal</h1>
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
          <TaskForm onSubmit={handleCreateTask} isLoading={tasksLoading} />
          <div className="mt-6">
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet.</p>
            ) : (
              <TaskList tasks={tasks} onUpdate={handleUpdateTask} />
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Mood Tracker</h2>
          <MoodForm onSubmit={handleCreateMood} isLoading={moodsLoading} />
          <div className="mt-6">
            {moods.length === 0 ? (
              <p className="text-gray-500">No mood entries yet.</p>
            ) : (
              <MoodList entries={moods} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
