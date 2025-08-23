import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { CurrentWeekAssignment, User } from '../../../server/src/schema';

interface UserAssignmentsProps {
  users: User[];
}

export function UserAssignments({ users }: UserAssignmentsProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userAssignments, setUserAssignments] = useState<CurrentWeekAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserAssignments = useCallback(async (userId: number) => {
    setIsLoading(true);
    try {
      const assignments = await trpc.getUserAssignments.query(userId);
      setUserAssignments(assignments);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
      setUserAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserAssignments(selectedUserId);
    } else {
      setUserAssignments([]);
    }
  }, [selectedUserId, loadUserAssignments]);

  const handleAssignmentCompletion = async (assignmentId: number, isCompleted: boolean) => {
    try {
      await trpc.updateAssignmentCompletion.mutate({ assignment_id: assignmentId, is_completed: isCompleted });
      // Update local state
      setUserAssignments(prev => 
        prev.map(assignment => 
          assignment.assignment_id === assignmentId 
            ? { ...assignment, is_completed: isCompleted, completed_at: isCompleted ? new Date() : null } 
            : assignment
        )
      );
    } catch (err) {
      console.error('Failed to update assignment completion:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Assignments</CardTitle>
        <p className="text-sm text-gray-500">
          View assignments for a specific user
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <Select onValueChange={(value) => setSelectedUserId(value ? parseInt(value) : null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user" />
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

          {selectedUserId && (
            <div>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse"></div>
                  ))}
                </div>
              ) : userAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No assignments found for this user.
                </div>
              ) : (
                <div className="space-y-3">
                  {userAssignments.map((assignment) => (
                    <div 
                      key={assignment.assignment_id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`user-assignment-${assignment.assignment_id}`}
                          checked={assignment.is_completed}
                          onCheckedChange={(checked) => 
                            handleAssignmentCompletion(assignment.assignment_id, !!checked)
                          }
                          className="mt-1"
                        />
                        <div>
                          <label 
                            htmlFor={`user-assignment-${assignment.assignment_id}`}
                            className={`font-medium ${assignment.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                          >
                            {assignment.chore_name}
                          </label>
                          {assignment.chore_description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {assignment.chore_description}
                            </p>
                          )}
                          <div className="text-sm text-gray-500 mt-2">
                            Week of {assignment.week_start_date.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {assignment.is_completed && assignment.completed_at && (
                        <div className="text-sm text-gray-500">
                          Completed on {new Date(assignment.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
