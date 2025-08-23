import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { User, Chore, WeeklyChoreAssignment } from '../../server/src/schema';

function App() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<Date>(getMonday(new Date()));
  const [userChores, setUserChores] = useState<WeeklyChoreAssignment[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newChoreName, setNewChoreName] = useState('');
  const [newChoreDescription, setNewChoreDescription] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingChores, setIsLoadingChores] = useState(false);

  // Helper function to get Monday of current week
  function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  // Load data functions
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadChores = useCallback(async () => {
    setIsLoadingChores(true);
    try {
      const result = await trpc.getChores.query();
      setChores(result);
    } catch (error) {
      console.error('Failed to load chores:', error);
    } finally {
      setIsLoadingChores(false);
    }
  }, []);

  const loadUserChores = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      const result = await trpc.getUserChores.query({
        user_id: selectedUser.id,
        week_start_date: weekStartDate
      });
      setUserChores(result);
    } catch (error) {
      console.error('Failed to load user chores:', error);
    }
  }, [selectedUser, weekStartDate]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadChores();
  }, [loadUsers, loadChores]);

  // Load user chores when user or week changes
  useEffect(() => {
    loadUserChores();
  }, [loadUserChores]);

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    
    try {
      const result = await trpc.createUser.mutate({ name: newUserName });
      setUsers([...users, result]);
      setNewUserName('');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  // Create chore
  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreName.trim()) return;
    
    try {
      const result = await trpc.createChore.mutate({
        name: newChoreName,
        description: newChoreDescription || null
      });
      setChores([...chores, result]);
      setNewChoreName('');
      setNewChoreDescription('');
    } catch (error) {
      console.error('Failed to create chore:', error);
    }
  };

  // Assign chores for the week
  const handleAssignChores = async () => {
    setIsAssigning(true);
    try {
      await trpc.assignChores.mutate({ week_start_date: weekStartDate });
      // Reload user chores after assignment
      loadUserChores();
    } catch (error) {
      console.error('Failed to assign chores:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Mark chore as complete
  const handleMarkComplete = async (assignmentId: number) => {
    try {
      await trpc.markChoreComplete.mutate({ assignment_id: assignmentId });
      // Reload user chores to reflect the change
      loadUserChores();
    } catch (error) {
      console.error('Failed to mark chore as complete:', error);
    }
  };

  // Format week range for display
  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">Weekly Chore Manager</h1>
          <p className="text-gray-600">Assign chores to household members and track completion</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex gap-2 mb-4">
                <Input
                  placeholder="User name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
                <Button type="submit">Add User</Button>
              </form>
              
              <div className="space-y-2">
                {isLoadingUsers ? (
                  <p className="text-gray-500">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-500">No users yet. Add one above!</p>
                ) : (
                  users.map((user) => (
                    <div 
                      key={user.id} 
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id 
                          ? 'bg-indigo-100 border-indigo-500' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{user.name}</h3>
                        {selectedUser?.id === user.id && (
                          <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Member since {user.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chore Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Chores</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChore} className="space-y-3 mb-4">
                <Input
                  placeholder="Chore name"
                  value={newChoreName}
                  onChange={(e) => setNewChoreName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Description (optional)"
                  value={newChoreDescription}
                  onChange={(e) => setNewChoreDescription(e.target.value)}
                />
                <Button type="submit">Add Chore</Button>
              </form>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingChores ? (
                  <p className="text-gray-500">Loading chores...</p>
                ) : chores.length === 0 ? (
                  <p className="text-gray-500">No chores yet. Add one above!</p>
                ) : (
                  chores.map((chore) => (
                    <div key={chore.id} className="p-3 rounded-md border bg-white">
                      <h3 className="font-medium">{chore.name}</h3>
                      {chore.description && (
                        <p className="text-sm text-gray-600 mt-1">{chore.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {chore.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Assignment Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Week:</span>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md font-medium">
                  {formatWeekRange(weekStartDate)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const prevWeek = new Date(weekStartDate);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    setWeekStartDate(prevWeek);
                  }}
                >
                  Previous Week
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const nextWeek = new Date(weekStartDate);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setWeekStartDate(nextWeek);
                  }}
                >
                  Next Week
                </Button>
                
                <Button 
                  onClick={handleAssignChores}
                  disabled={isAssigning || users.length === 0 || chores.length === 0}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Chores'}
                </Button>
              </div>
            </div>
            
            {selectedUser ? (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {selectedUser.name}'s Chores for {formatWeekRange(weekStartDate)}
                </h3>
                
                {userChores.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No chores assigned for this week. Click "Assign Chores" to get started!
                    </p>
                    <Button 
                      onClick={handleAssignChores}
                      disabled={isAssigning || users.length === 0 || chores.length === 0}
                    >
                      {isAssigning ? 'Assigning...' : 'Assign Chores Now'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userChores.map((assignment) => {
                      const chore = chores.find(c => c.id === assignment.chore_id);
                      return chore ? (
                        <div 
                          key={assignment.id} 
                          className={`p-4 rounded-lg border ${
                            assignment.is_completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={assignment.is_completed}
                              onCheckedChange={() => 
                                handleMarkComplete(assignment.id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className={`font-medium ${assignment.is_completed ? 'line-through text-gray-500' : ''}`}>
                                {chore.name}
                              </h4>
                              {chore.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {chore.description}
                                </p>
                              )}
                              {assignment.is_completed && assignment.completed_at && (
                                <p className="text-xs text-green-600 mt-2">
                                  Completed on {assignment.completed_at.toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Select a user to view their assigned chores
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
