import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit2, Plus, Check, X, AlertCircle } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../server/src/schema';

interface TaskManagerProps {
  tasks: Task[];
  onTaskChange: () => void;
}

export function TaskManager({ tasks, onTaskChange }: TaskManagerProps) {
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const taskData: CreateTaskInput = {
        description: newTaskDescription.trim()
      };
      await trpc.createTask.mutate(taskData);
      setNewTaskDescription('');
      onTaskChange();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setError(null);
    try {
      const updateData: UpdateTaskInput = {
        id: task.id,
        completed: !task.completed
      };
      await trpc.updateTask.mutate(updateData);
      onTaskChange();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingDescription(task.description);
    setError(null);
  };

  const handleSaveEdit = async (taskId: number) => {
    if (!editingDescription.trim()) return;

    setError(null);
    try {
      const updateData: UpdateTaskInput = {
        id: taskId,
        description: editingDescription.trim()
      };
      await trpc.updateTask.mutate(updateData);
      setEditingTaskId(null);
      setEditingDescription('');
      onTaskChange();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task description. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingDescription('');
    setError(null);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setError(null);
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      onTaskChange();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Task Form */}
      <Card className="p-4 bg-gray-50 border-dashed border-2 border-gray-300">
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <Input
            placeholder="What would you like to accomplish today?"
            value={newTaskDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskDescription(e.target.value)}
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newTaskDescription.trim()}
            className="px-6"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No tasks yet. Add one above to get started!</p>
          </div>
        ) : (
          tasks
            .sort((a: Task, b: Task) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((task: Task) => (
              <Card 
                key={task.id} 
                className={`p-4 transition-all duration-200 ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    {editingTaskId === task.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingDescription}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingDescription(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(task.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveEdit(task.id)}
                          disabled={!editingDescription.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className={`${
                          task.completed 
                            ? 'line-through text-gray-600' 
                            : 'text-gray-900'
                        } break-words`}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>
                            Created: {new Date(task.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {task.completed && task.completed_at && (
                            <span>
                              Completed: {new Date(task.completed_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {editingTaskId !== task.id && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(task)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="text-center text-sm text-gray-500 pt-2">
          {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
        </div>
      )}
    </div>
  );
}
