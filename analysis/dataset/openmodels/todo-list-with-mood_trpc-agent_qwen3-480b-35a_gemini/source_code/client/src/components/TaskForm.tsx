import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { CreateTaskInput, Task } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading?: boolean;
  initialTask?: Task | null;
  onUpdate?: (data: Partial<Task>) => Promise<void>;
}

export function TaskForm({ 
  onSubmit, 
  isLoading = false, 
  initialTask = null,
  onUpdate 
}: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: initialTask?.title || '',
    description: initialTask?.description || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initialTask && onUpdate) {
      await onUpdate({
        ...formData,
        id: initialTask.id,
        completed: initialTask.completed,
      });
    } else {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: null,
      });
    }
  };

  const handleInputChange = (field: keyof CreateTaskInput, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="What needs to be done?"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''} // Fallback for null
          onChange={(e) => handleInputChange('description', e.target.value || null)}
          placeholder="Add details..."
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="completed" 
          checked={initialTask?.completed || false}
          onCheckedChange={(checked) => {
            if (initialTask && onUpdate) {
              onUpdate({ completed: checked as boolean });
            }
          }}
          disabled={!initialTask}
        />
        <Label htmlFor="completed" className={initialTask?.completed ? "line-through text-gray-500" : ""}>
          Completed
        </Label>
      </div>
      
      <Button type="submit" disabled={isLoading || !formData.title.trim()}>
        {isLoading 
          ? (initialTask ? 'Updating...' : 'Creating...') 
          : (initialTask ? 'Update Task' : 'Add Task')}
      </Button>
    </form>
  );
}
