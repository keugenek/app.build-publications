import './App.css';
import { useEffect, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
// Stubbed data handling - no backend calls
import type { Task, CreateTaskInput, MoodEntry, CreateMoodInput, Mood } from '../../server/src/schema';

function App() {
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null,
    completed: false,
    due_date: null,
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Moods state
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [moodForm, setMoodForm] = useState<CreateMoodInput>({
    mood: 'Neutral' as Mood,
    note: null,
    // date omitted to let server default to today
  });
  const [isLoggingMood, setIsLoggingMood] = useState(false);

  // Load tasks (stub)
  const loadTasks = useCallback(async () => {
    const placeholder: Task[] = [];
    setTasks(placeholder);
  }, []);

  // Load moods (stub)
  const loadMoods = useCallback(async () => {
    const placeholder: MoodEntry[] = [];
    setMoods(placeholder);
  }, []);

  useEffect(() => {
    loadTasks();
    loadMoods();
  }, [loadTasks, loadMoods]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTask(true);
    try {
      // Stub: simulate task creation
      const created: Task = {
        id: Date.now(),
        title: taskForm.title,
        description: taskForm.description ?? null,
        completed: taskForm.completed ?? false,
        due_date: taskForm.due_date ?? null,
        created_at: new Date(),
      };
      setTasks((prev) => [...prev, created]);
      setTaskForm({ title: '', description: null, completed: false, due_date: null });
    } catch (e) {
      console.error('Create task error', e);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingMood(true);
    try {
      // Stub: simulate mood logging
      const logged: MoodEntry = {
        id: Date.now(),
        date: new Date(),
        mood: moodForm.mood,
        note: moodForm.note ?? null,
        created_at: new Date(),
      };
      setMoods((prev) => [...prev, logged]);
      setMoodForm({ mood: 'Neutral' as Mood, note: null });
    } catch (e) {
      console.error('Log mood error', e);
    } finally {
      setIsLoggingMood(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Daily Journal</h1>

      {/* Task Section */}
      <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">Tasks</h2>
        <form onSubmit={handleTaskSubmit} className="space-y-2 mb-4">
          <Input
            placeholder="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={taskForm.description ?? ''}
            onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value || null }))}
          />
          <Button type="submit" disabled={isCreatingTask} className="w-full">
            {isCreatingTask ? 'Adding...' : 'Add Task'}
          </Button>
        </form>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="border p-2 rounded-md bg-white dark:bg-gray-900">
                <div className="font-medium">{t.title}</div>
                {t.description && <div className="text-sm text-gray-600 dark:text-gray-400">{t.description}</div>}
                <div className="text-xs text-gray-500">
                  Created: {new Date(t.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Mood Section */}
      <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">Mood Tracker</h2>
        <form onSubmit={handleMoodSubmit} className="space-y-2 mb-4">
          <Select
            value={moodForm.mood}
            onValueChange={(value) => setMoodForm((prev) => ({ ...prev, mood: value as Mood }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              {['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited'].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Note (optional)"
            value={moodForm.note ?? ''}
            onChange={(e) => setMoodForm((prev) => ({ ...prev, note: e.target.value || null }))}
          />
          <Button type="submit" disabled={isLoggingMood} className="w-full">
            {isLoggingMood ? 'Logging...' : 'Log Mood'}
          </Button>
        </form>
        {moods.length === 0 ? (
          <p className="text-gray-500">No mood entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {moods.map((m) => (
              <li key={m.id} className="border p-2 rounded-md bg-white dark:bg-gray-900">
                <div className="font-medium">{m.mood}</div>
                {m.note && <div className="text-sm text-gray-600 dark:text-gray-400">{m.note}</div>}
                <div className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
