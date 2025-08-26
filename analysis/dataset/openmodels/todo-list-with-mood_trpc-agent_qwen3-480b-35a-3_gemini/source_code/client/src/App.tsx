import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput, UpdateTaskInput, LogMoodInput, Mood } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';


function App() {
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<CreateTaskInput>({
    title: '',
    description: null,
    completed: false
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Mood state
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodDescription, setMoodDescription] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  // Load moods
  const loadMoods = useCallback(async () => {
    try {
      const result = await trpc.getMoods.query();
      setMoods(result);
    } catch (error) {
      console.error('Failed to load moods:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadTasks();
    loadMoods();
  }, [loadTasks, loadMoods]);

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    setIsLoading(true);
    try {
      const createdTask = await trpc.createTask.mutate(newTask);
      setTasks([...tasks, createdTask]);
      setNewTask({ title: '', description: null, completed: false });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update task
  const handleUpdateTask = async (id: number, updates: Partial<UpdateTaskInput>) => {
    try {
      const updateData: UpdateTaskInput = {
        id,
        ...updates
      };
      
      const updatedTask = await trpc.updateTask.mutate(updateData);
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
      
      if (editingTask?.id === id) {
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: number) => {
    try {
      await trpc.deleteTask.mutate(id);
      setTasks(tasks.filter(task => task.id !== id));
      
      if (editingTask?.id === id) {
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Log mood
  const handleLogMood = async () => {
    if (selectedMood === null) return;
    
    setIsLoading(true);
    try {
      const moodData: LogMoodInput = {
        mood: selectedMood,
        description: moodDescription || null
      };
      
      const loggedMood = await trpc.logMood.mutate(moodData);
      setMoods([loggedMood, ...moods]);
      setSelectedMood(null);
      setMoodDescription('');
    } catch (error) {
      console.error('Failed to log mood:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get mood label
  const getMoodLabel = (mood: number) => {
    switch (mood) {
      case 1: return '😢 Very Sad';
      case 2: return '😞 Sad';
      case 3: return '😐 Neutral';
      case 4: return '🙂 Happy';
      case 5: return '😄 Very Happy';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Daily Journal</h1>
          <p className="text-muted-foreground">Track your tasks and mood</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="mood">Mood Tracker</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Title *</Label>
                    <Input
                      id="task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="What needs to be done?"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={newTask.description || ''}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value || null})}
                      placeholder="Add details (optional)"
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Task'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">No tasks yet. Create your first task above!</p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="flex items-start p-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => 
                          handleUpdateTask(task.id, { completed: checked as boolean })
                        }
                        className="mt-1 mr-3"
                      />
                      
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {task.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTask(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="mood">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>How are you feeling today?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Select Mood</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((mood) => (
                      <Button
                        key={mood}
                        variant={selectedMood === mood ? "default" : "outline"}
                        className="py-4 flex flex-col items-center"
                        onClick={() => setSelectedMood(mood)}
                      >
                        <span className="text-2xl">
                          {mood === 1 ? '😢' : mood === 2 ? '😞' : mood === 3 ? '😐' : mood === 4 ? '🙂' : '😄'}
                        </span>
                        <span className="text-xs mt-1">{mood}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="mood-description">Description (optional)</Label>
                  <Textarea
                    id="mood-description"
                    value={moodDescription}
                    onChange={(e) => setMoodDescription(e.target.value)}
                    placeholder="What's contributing to your mood today?"
                  />
                </div>
                
                <Button 
                  onClick={handleLogMood} 
                  disabled={selectedMood === null || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Logging...' : 'Log Mood'}
                </Button>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Mood Logs</h2>
              {moods.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">No mood entries yet. Log your first mood above!</p>
                  </CardContent>
                </Card>
              ) : (
                moods.slice(0, 5).map((mood) => (
                  <Card key={mood.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">
                          {mood.mood === 1 ? '😢' : mood.mood === 2 ? '😞' : mood.mood === 3 ? '😐' : mood.mood === 4 ? '🙂' : '😄'}
                        </span>
                        <div>
                          <h3 className="font-medium">{getMoodLabel(mood.mood)}</h3>
                          {mood.description && (
                            <p className="text-sm text-muted-foreground">{mood.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {mood.created_at.toLocaleDateString()} at {mood.created_at.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Journal History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Your history of tasks and moods will appear here.
                  <br />
                  <br />
                  (This feature will show correlation between tasks and mood once the backend is implemented)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({
                    ...editingTask, 
                    description: e.target.value || null
                  })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-completed"
                  checked={editingTask.completed}
                  onCheckedChange={(checked) => 
                    setEditingTask({...editingTask, completed: checked as boolean})
                  }
                />
                <Label htmlFor="edit-completed">Mark as completed</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleUpdateTask(editingTask.id, {
                    title: editingTask.title,
                    description: editingTask.description,
                    completed: editingTask.completed
                  });
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
