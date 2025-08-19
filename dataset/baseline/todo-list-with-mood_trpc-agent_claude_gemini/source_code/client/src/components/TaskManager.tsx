import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput } from '../../../server/src/schema';

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: () => Promise<void>;
}

export function TaskManager({ tasks, onTasksChange }: TaskManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await trpc.createTask.mutate(formData);
      setFormData({ title: '', description: null });
      setIsCreating(false);
      await onTasksChange();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (taskId: number, isCompleted: boolean) => {
    try {
      await trpc.updateTask.mutate({
        id: taskId,
        is_completed: !isCompleted,
      });
      await onTasksChange();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      await onTasksChange();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedTasks = tasks.filter((task: Task) => task.is_completed);
  const pendingTasks = tasks.filter((task: Task) => !task.is_completed);

  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      {isCreating ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <Input
            placeholder="Task title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
            }
            required
            className="bg-white"
          />
          <Textarea
            placeholder="Description (optional)"
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateTaskInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            className="bg-white"
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setFormData({ title: '', description: null });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => setIsCreating(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Task
        </Button>
      )}

      {/* Task Statistics */}
      {tasks.length > 0 && (
        <div className="flex gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            {completedTasks.length} completed
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Calendar className="w-3 h-3 mr-1" />
            {pendingTasks.length} pending
          </Badge>
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No tasks yet. Create your first task above! 📝</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pending Tasks ({pendingTasks.length})
              </h3>
              {pendingTasks.map((task: Task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed Tasks ({completedTasks.length})
              </h3>
              {completedTasks.map((task: Task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number, isCompleted: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function TaskItem({ task, onToggleComplete, onDelete }: TaskItemProps) {
  return (
    <div className={`p-4 rounded-lg border transition-all ${
      task.is_completed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={() => onToggleComplete(task.id, task.is_completed)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${
            task.is_completed ? 'line-through text-gray-600' : 'text-gray-900'
          }`}>
            {task.title}
          </h4>
          {task.description && (
            <p className={`mt-1 text-sm ${
              task.is_completed ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>Created: {task.created_at.toLocaleDateString()}</span>
            {task.completed_at && (
              <span>Completed: {task.completed_at.toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(task.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
