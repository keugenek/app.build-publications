import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle2, Circle, Smile, Frown, Meh } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput, MoodEntry, CreateMoodEntryInput, DailyJournalEntry } from '../../server/src/schema';

// Mood icons mapping
const moodIcons = {
  1: { icon: Frown, color: 'text-red-500', label: 'Very Low' },
  2: { icon: Frown, color: 'text-orange-500', label: 'Low' },
  3: { icon: Meh, color: 'text-yellow-500', label: 'Neutral' },
  4: { icon: Smile, color: 'text-green-500', label: 'Good' },
  5: { icon: Smile, color: 'text-emerald-500', label: 'Very Good' }
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  // Task form state
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    name: ''
  });

  // Mood form state
  const [moodForm, setMoodForm] = useState<CreateMoodEntryInput>({
    mood_score: 3,
    notes: null,
    entry_date: new Date().toISOString().split('T')[0]
  });

  // Date range for journal view
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  const loadMoodEntries = useCallback(async () => {
    try {
      const result = await trpc.getMoodEntries.query();
      setMoodEntries(result);
    } catch (error) {
      console.error('Failed to load mood entries:', error);
    }
  }, []);

  const loadDailyJournal = useCallback(async () => {
    try {
      const result = await trpc.getDailyJournal.query({
        start_date: journalDate
      });
      setDailyEntries(result);
    } catch (error) {
      console.error('Failed to load daily journal:', error);
    }
  }, [journalDate]);

  useEffect(() => {
    loadTasks();
    loadMoodEntries();
    loadDailyJournal();
  }, [loadTasks, loadMoodEntries, loadDailyJournal]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name.trim()) return;
    
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(taskForm);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setTaskForm({ name: '' });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        is_completed: !task.is_completed
      });
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t)
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCreateMoodEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newMoodEntry = await trpc.createMoodEntry.mutate(moodForm);
      setMoodEntries((prev: MoodEntry[]) => [...prev, newMoodEntry]);
      setMoodForm({
        mood_score: 3,
        notes: null,
        entry_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to create mood entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodIcon = (score: number) => {
    const moodData = moodIcons[score as keyof typeof moodIcons];
    const IconComponent = moodData.icon;
    return <IconComponent className={`h-5 w-5 ${moodData.color}`} />;
  };

  const getMoodLabel = (score: number) => {
    return moodIcons[score as keyof typeof moodIcons]?.label || 'Unknown';
  };

  const todaysTasks = tasks.filter((task: Task) => {
    const today = new Date().toDateString();
    const taskDate = new Date(task.created_at).toDateString();
    return today === taskDate;
  });

  const todaysMood = moodEntries.find((entry: MoodEntry) => {
    const today = new Date().toDateString();
    const entryDate = new Date(entry.entry_date).toDateString();
    return today === entryDate;
  });

  const completedTasks = todaysTasks.filter((task: Task) => task.is_completed);
  const incompleteTasks = todaysTasks.filter((task: Task) => !task.is_completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Calendar className="h-8 w-8 text-indigo-600" />
            Daily Journal
          </h1>
          <p className="text-gray-600">Track your tasks and mood in one place</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="journal">Journal View</TabsTrigger>
          </TabsList>

          {/* Today Tab - Overview */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Today's Tasks Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Today's Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Progress</span>
                      <Badge variant="outline">
                        {completedTasks.length}/{todaysTasks.length} completed
                      </Badge>
                    </div>
                    {todaysTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">No tasks for today yet</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {todaysTasks.map((task: Task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 p-2 rounded ${
                              task.is_completed ? 'bg-green-50 text-green-800' : 'bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={() => handleToggleTask(task)}
                              className="flex-shrink-0"
                            >
                              {task.is_completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                            <span className={task.is_completed ? 'line-through' : ''}>
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Mood Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-yellow-600" />
                    Today's Mood
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysMood ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {getMoodIcon(todaysMood.mood_score)}
                        <div>
                          <p className="font-medium">{getMoodLabel(todaysMood.mood_score)}</p>
                          <p className="text-sm text-gray-600">Score: {todaysMood.mood_score}/5</p>
                        </div>
                      </div>
                      {todaysMood.notes && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Notes:</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{todaysMood.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No mood entry for today yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTask} className="flex gap-2">
                  <Input
                    placeholder="What do you need to do?"
                    value={taskForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTaskForm((prev: CreateTaskInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="flex-1"
                    required
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Task'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Incomplete Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">To Do ({incompleteTasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {incompleteTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">All tasks completed! 🎉</p>
                    ) : (
                      incompleteTasks.map((task: Task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="flex-shrink-0"
                          >
                            <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                          </button>
                          <div className="flex-1">
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(task.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Completed Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Completed ({completedTasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {completedTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">No completed tasks yet</p>
                    ) : (
                      completedTasks.map((task: Task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
                        >
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="flex-shrink-0"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </button>
                          <div className="flex-1">
                            <p className="font-medium text-green-800 line-through">{task.name}</p>
                            <p className="text-xs text-green-600">
                              Completed: {new Date(task.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mood Tab */}
          <TabsContent value="mood" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log Your Mood</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMoodEntry} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How are you feeling today?
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const moodData = moodIcons[score as keyof typeof moodIcons];
                        const IconComponent = moodData.icon;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setMoodForm((prev: CreateMoodEntryInput) => ({ 
                              ...prev, 
                              mood_score: score 
                            }))}
                            className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                              moodForm.mood_score === score
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <IconComponent className={`h-6 w-6 ${moodData.color}`} />
                            <span className="text-xs font-medium">{score}</span>
                            <span className="text-xs text-gray-500">{moodData.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={moodForm.entry_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMoodForm((prev: CreateMoodEntryInput) => ({ 
                          ...prev, 
                          entry_date: e.target.value 
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <Textarea
                      placeholder="How was your day? What affected your mood?"
                      value={moodForm.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setMoodForm((prev: CreateMoodEntryInput) => ({ 
                          ...prev, 
                          notes: e.target.value || null 
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save Mood Entry'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Mood Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Mood Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {moodEntries.length === 0 ? (
                    <p className="text-gray-500 text-sm">No mood entries yet. Start tracking your mood!</p>
                  ) : (
                    moodEntries
                      .sort((a: MoodEntry, b: MoodEntry) => 
                        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
                      )
                      .map((entry: MoodEntry) => (
                        <div key={entry.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getMoodIcon(entry.mood_score)}
                              <span className="font-medium">
                                {getMoodLabel(entry.mood_score)}
                              </span>
                              <Badge variant="outline">{entry.mood_score}/5</Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.entry_date).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal View Tab */}
          <TabsContent value="journal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Journal View</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={journalDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJournalDate(e.target.value)
                    }
                    className="w-auto"
                  />
                  <Button onClick={loadDailyJournal} variant="outline">
                    Load Date
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dailyEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No entries found for {new Date(journalDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Add tasks and mood entries to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dailyEntries.map((entry: DailyJournalEntry, index: number) => (
                      <div key={entry.date} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            {new Date(entry.date).toLocaleDateString()}
                          </h3>
                          {entry.mood_entry && (
                            <div className="flex items-center gap-2">
                              {getMoodIcon(entry.mood_entry.mood_score)}
                              <span className="text-sm">
                                Mood: {getMoodLabel(entry.mood_entry.mood_score)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Tasks */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">Tasks</h4>
                            {entry.tasks.length === 0 ? (
                              <p className="text-gray-500 text-sm">No tasks</p>
                            ) : (
                              <div className="space-y-2">
                                {entry.tasks.map((task: Task) => (
                                  <div key={task.id} className="flex items-center gap-2">
                                    {task.is_completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className={task.is_completed ? 'line-through text-gray-600' : ''}>
                                      {task.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Mood */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">Mood</h4>
                            {entry.mood_entry ? (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  {getMoodIcon(entry.mood_entry.mood_score)}
                                  <span>{getMoodLabel(entry.mood_entry.mood_score)}</span>
                                  <Badge variant="outline">
                                    {entry.mood_entry.mood_score}/5
                                  </Badge>
                                </div>
                                {entry.mood_entry.notes && (
                                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                    {entry.mood_entry.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No mood entry</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
