import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { DailyEntryWithTasks, CreateTaskInput, Mood } from '../../../server/src/schema';

interface TodayViewProps {
  entry: DailyEntryWithTasks;
  onUpdate: (entry: DailyEntryWithTasks) => void;
}

const moodOptions: { value: Mood; label: string; emoji: string }[] = [
  { value: 'very_sad', label: 'Very Sad', emoji: '😢' },
  { value: 'sad', label: 'Sad', emoji: '😞' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'very_happy', label: 'Very Happy', emoji: '😄' }
];

export function TodayView({ entry, onUpdate }: TodayViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [notes, setNotes] = useState(entry.notes || '');

  const completedTasks = entry.tasks.filter(task => task.is_completed).length;
  const totalTasks = entry.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      const taskInput: CreateTaskInput = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        daily_entry_id: entry.id
      };
      
      const newTask = await trpc.createTask.mutate(taskInput);
      
      const updatedEntry: DailyEntryWithTasks = {
        ...entry,
        tasks: [...entry.tasks, newTask]
      };
      onUpdate(updatedEntry);
      
      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: taskId,
        is_completed: isCompleted
      });
      
      const updatedTasks = entry.tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: isCompleted, completed_at: isCompleted ? new Date() : null } : task
      );
      
      const updatedEntry: DailyEntryWithTasks = {
        ...entry,
        tasks: updatedTasks
      };
      onUpdate(updatedEntry);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      
      const updatedTasks = entry.tasks.filter(task => task.id !== taskId);
      const updatedEntry: DailyEntryWithTasks = {
        ...entry,
        tasks: updatedTasks
      };
      onUpdate(updatedEntry);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleMoodChange = async (mood: Mood) => {
    setIsUpdatingMood(true);
    try {
      const updatedEntry = await trpc.updateDailyEntry.mutate({
        id: entry.id,
        mood: mood
      });
      
      onUpdate({
        ...entry,
        mood: mood,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Failed to update mood:', error);
    } finally {
      setIsUpdatingMood(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      await trpc.updateDailyEntry.mutate({
        id: entry.id,
        notes: notes || null
      });
      
      onUpdate({
        ...entry,
        notes: notes || null,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const currentMood = moodOptions.find(option => option.value === entry.mood);

  return (
    <div className="space-y-6">
      {/* Header with date and mood */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {entry.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm text-gray-600">
                  Tasks: {completedTasks}/{totalTasks} completed
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-48">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <Badge variant="secondary">
                  {progressPercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">How are you feeling?</p>
              <Select
                value={entry.mood || ''}
                onValueChange={(value) => handleMoodChange(value as Mood)}
                disabled={isUpdatingMood}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select your mood">
                    {currentMood && (
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{currentMood.emoji}</span>
                        {currentMood.label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{option.emoji}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ Today's Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new task form */}
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="What do you need to do today?"
                value={newTaskTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isAddingTask || !newTaskTitle.trim()}>
                {isAddingTask ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
            <Input
              placeholder="Description (optional)"
              value={newTaskDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskDescription(e.target.value)}
            />
          </form>

          <Separator />

          {/* Task list */}
          {entry.tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tasks yet. Add one above to get started! 🚀
            </p>
          ) : (
            <div className="space-y-3">
              {entry.tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    task.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className={`text-sm mt-1 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.completed_at && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Completed at {task.completed_at.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Daily Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How was your day? Any thoughts or reflections..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            onBlur={handleNotesUpdate}
            className="min-h-32"
          />
          <p className="text-xs text-gray-500 mt-2">
            Notes are saved automatically when you click outside the text area
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
