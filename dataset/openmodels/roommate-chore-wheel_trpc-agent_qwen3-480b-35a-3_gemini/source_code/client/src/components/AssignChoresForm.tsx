import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Chore, User } from '../../../server/src/schema';

interface AssignChoresFormProps {
  chores: Chore[];
  users: User[];
  onSuccess: () => void;
}

export function AssignChoresForm({ chores, users, onSuccess }: AssignChoresFormProps) {
  const [assignments, setAssignments] = useState<Array<{ choreId: number; userId: number | null }>>([]);
  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAssignment = () => {
    setAssignments([...assignments, { choreId: 0, userId: null }]);
  };

  const removeAssignment = (index: number) => {
    const newAssignments = [...assignments];
    newAssignments.splice(index, 1);
    setAssignments(newAssignments);
  };

  const updateAssignment = (index: number, field: 'choreId' | 'userId', value: number | null) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setAssignments(newAssignments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weekStartDate || assignments.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validAssignments = assignments
        .filter(a => a.choreId !== 0 && a.userId !== null)
        .map(a => ({
          chore_id: a.choreId,
          user_id: a.userId as number
        }));

      if (validAssignments.length === 0) {
        return;
      }

      await trpc.assignChores.mutate({
        week_start_date: new Date(weekStartDate),
        assignments: validAssignments
      });

      onSuccess();
      setAssignments([]);
      setWeekStartDate('');
    } catch (error) {
      console.error('Failed to assign chores:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Chores</CardTitle>
        <p className="text-sm text-gray-500">
          Manually assign chores to users for a specific week
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="week-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Week Start Date
            </label>
            <input
              type="date"
              id="week-start-date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Assignments
              </label>
              <Button type="button" onClick={addAssignment} variant="outline" size="sm">
                Add Assignment
              </Button>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-4 border border-dashed rounded-md">
                <p className="text-gray-500">No assignments added yet</p>
                <Button type="button" onClick={addAssignment} variant="outline" className="mt-2">
                  Add First Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                    <div className="flex-1">
                      <Select
                        value={assignment.choreId.toString()}
                        onValueChange={(value) => updateAssignment(index, 'choreId', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chore" />
                        </SelectTrigger>
                        <SelectContent>
                          {chores.map((chore) => (
                            <SelectItem key={chore.id} value={chore.id.toString()}>
                              {chore.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Select
                        value={assignment.userId?.toString() || ''}
                        onValueChange={(value) => updateAssignment(index, 'userId', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAssignment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !weekStartDate || assignments.length === 0}
            className="w-full"
          >
            {isSubmitting ? 'Assigning Chores...' : 'Assign Chores'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
