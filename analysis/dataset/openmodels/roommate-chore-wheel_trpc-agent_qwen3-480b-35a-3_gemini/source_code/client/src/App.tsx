import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/utils/trpc';
import { AssignChoresForm } from '@/components/AssignChoresForm';
import { UserAssignments } from '@/components/UserAssignments';
import type { CurrentWeekAssignment, Chore, User } from '../../server/src/schema';

function App() {
  const [currentWeekAssignments, setCurrentWeekAssignments] = useState<CurrentWeekAssignment[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all necessary data
      const [assignments, choresData, usersData] = await Promise.all([
        trpc.getCurrentWeekAssignments.query().catch(() => [] as CurrentWeekAssignment[]),
        trpc.getChores.query().catch(() => [] as Chore[]),
        trpc.getUsers.query().catch(() => [] as User[])
      ]);
      
      setCurrentWeekAssignments(assignments);
      setChores(choresData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again later.');
      // Initialize with empty arrays on error
      setCurrentWeekAssignments([]);
      setChores([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const refreshData = () => {
    loadAllData();
  };

  const handleAssignmentCompletion = async (assignmentId: number, isCompleted: boolean) => {
    try {
      await trpc.updateAssignmentCompletion.mutate({ assignment_id: assignmentId, is_completed: isCompleted });
      // Update local state
      setCurrentWeekAssignments(prev => 
        prev.map(assignment => 
          assignment.assignment_id === assignmentId 
            ? { ...assignment, is_completed: isCompleted, completed_at: isCompleted ? new Date() : null } 
            : assignment
        )
      );
    } catch (err) {
      console.error('Failed to update assignment completion:', err);
      setError('Failed to update assignment. Please try again.');
    }
  };

  if (error && currentWeekAssignments.length === 0 && chores.length === 0 && users.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
          <Button 
            className="mt-2" 
            onClick={loadAllData}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Chore Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your weekly household chores</p>
        </header>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="current">Current Week</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Current Week Assignments</CardTitle>
                  <Button onClick={refreshData} variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {isLoading 
                    ? "Loading assignments..." 
                    : `Showing ${currentWeekAssignments.length} assignments for this week`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : currentWeekAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No assignments found for this week.</p>
                    <p className="text-sm text-gray-400 mt-2">Chores will be assigned automatically each week.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentWeekAssignments.map((assignment) => (
                      <div 
                        key={assignment.assignment_id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={`assignment-${assignment.assignment_id}`}
                            checked={assignment.is_completed}
                            onCheckedChange={(checked) => 
                              handleAssignmentCompletion(assignment.assignment_id, !!checked)
                            }
                            className="mt-1"
                          />
                          <div>
                            <label 
                              htmlFor={`assignment-${assignment.assignment_id}`}
                              className={`font-medium ${assignment.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                            >
                              {assignment.chore_name}
                            </label>
                            {assignment.chore_description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {assignment.chore_description}
                              </p>
                            )}
                            <div className="flex items-center mt-2">
                              <span className="text-sm text-gray-500">
                                Assigned to: {assignment.user_name}
                              </span>
                              {assignment.is_completed && assignment.completed_at && (
                                <Badge variant="secondary" className="ml-2">
                                  Completed
                                </Badge>
                              )}
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="grid grid-cols-1 gap-6">
              <UserAssignments users={users} />
            </div>
          </TabsContent>
          
          <TabsContent value="manage">
            <div className="grid grid-cols-1 gap-6">
              <AssignChoresForm 
                chores={chores} 
                users={users} 
                onSuccess={loadAllData} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chores</CardTitle>
                    <p className="text-sm text-gray-500">
                      {isLoading 
                        ? "Loading chores..." 
                        : `Total: ${chores.length} chores`
                      }
                    </p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : chores.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No chores available.</p>
                    ) : (
                      <ul className="space-y-2">
                        {chores.map((chore) => (
                          <li 
                            key={chore.id} 
                            className="flex items-start p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div>
                              <div className="font-medium">{chore.name}</div>
                              {chore.description && (
                                <p className="text-sm text-gray-600 mt-1">{chore.description}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <p className="text-sm text-gray-500">
                      {isLoading 
                        ? "Loading users..." 
                        : `Total: ${users.length} users`
                      }
                    </p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : users.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No users available.</p>
                    ) : (
                      <ul className="space-y-2">
                        {users.map((user) => (
                          <li 
                            key={user.id} 
                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center mr-3" />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              {user.email && (
                                <p className="text-sm text-gray-600">{user.email}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Chores are automatically assigned each week. Check back regularly for updates.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
