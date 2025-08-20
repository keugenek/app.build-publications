import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { Member, Chore, Assignment, CreateMemberInput, CreateChoreInput, UpdateAssignmentInput } from '../../server/src/schema';

function App() {
  // State for members
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  
  // State for chores
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChoreName, setNewChoreName] = useState('');
  const [newChoreDescription, setNewChoreDescription] = useState('');
  
  // State for assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Loading states
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [isCreatingChore, setIsCreatingChore] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Load data on component mount
  const loadData = useCallback(async () => {
    try {
      const [membersData, choresData, assignmentsData] = await Promise.all([
        trpc.getMembers.query(),
        trpc.getChores.query(),
        trpc.getAssignments.query()
      ]);
      
      setMembers(membersData);
      setChores(choresData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create a new member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    setIsCreatingMember(true);
    try {
      const input: CreateMemberInput = { name: newMemberName.trim() };
      const newMember = await trpc.createMember.mutate(input);
      setMembers(prev => [...prev, newMember]);
      setNewMemberName('');
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setIsCreatingMember(false);
    }
  };

  // Create a new chore
  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreName.trim()) return;
    
    setIsCreatingChore(true);
    try {
      const input: CreateChoreInput = {
        name: newChoreName.trim(),
        description: newChoreDescription.trim() || null
      };
      const newChore = await trpc.createChore.mutate(input);
      setChores(prev => [...prev, newChore]);
      setNewChoreName('');
      setNewChoreDescription('');
    } catch (error) {
      console.error('Failed to create chore:', error);
    } finally {
      setIsCreatingChore(false);
    }
  };

  // Assign chores to members
  const handleAssignChores = async () => {
    setIsAssigning(true);
    try {
      await trpc.assignChores.mutate();
      // Reload assignments after assigning
      const assignmentsData = await trpc.getAssignments.query();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to assign chores:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Toggle assignment completion
  const toggleAssignmentCompletion = async (assignment: Assignment) => {
    try {
      const input: UpdateAssignmentInput = {
        id: assignment.id,
        is_completed: !assignment.is_completed
      };
      await trpc.updateAssignment.mutate(input);
      
      // Update local state
      setAssignments(prev => 
        prev.map(a => 
          a.id === assignment.id 
            ? { ...a, is_completed: !a.is_completed, completed_at: !a.is_completed ? new Date() : null } 
            : a
        )
      );
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get current week's assignments
  const getCurrentWeekAssignments = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    
    return assignments.filter(assignment => {
      const assignmentWeekStart = new Date(assignment.week_start_date);
      assignmentWeekStart.setHours(0, 0, 0, 0);
      return assignmentWeekStart.getTime() === weekStart.getTime();
    });
  };

  const currentWeekAssignments = getCurrentWeekAssignments();

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">Household Chore Manager</h1>
          <p className="text-muted-foreground mt-2">
            Assign chores to household members and track completion
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>Household Members</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMember} className="flex gap-2 mb-4">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Add new member"
                  required
                />
                <Button type="submit" disabled={isCreatingMember}>
                  {isCreatingMember ? 'Adding...' : 'Add'}
                </Button>
              </form>
              
              {members.length > 0 ? (
                <ul className="space-y-2">
                  {members.map((member) => (
                    <li 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Added {member.created_at.toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No members added yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chores Section */}
          <Card>
            <CardHeader>
              <CardTitle>Chores</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChore} className="space-y-3 mb-4">
                <Input
                  value={newChoreName}
                  onChange={(e) => setNewChoreName(e.target.value)}
                  placeholder="Chore name"
                  required
                />
                <Input
                  value={newChoreDescription}
                  onChange={(e) => setNewChoreDescription(e.target.value)}
                  placeholder="Description (optional)"
                />
                <Button type="submit" className="w-full" disabled={isCreatingChore}>
                  {isCreatingChore ? 'Creating...' : 'Add Chore'}
                </Button>
              </form>
              
              {chores.length > 0 ? (
                <ul className="space-y-3">
                  {chores.map((chore) => (
                    <li 
                      key={chore.id} 
                      className="p-3 bg-muted rounded-md border"
                    >
                      <h3 className="font-medium">{chore.name}</h3>
                      {chore.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {chore.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Added {chore.created_at.toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No chores added yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignments Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Weekly Assignments</CardTitle>
              <Button 
                onClick={handleAssignChores}
                disabled={isAssigning || members.length === 0 || chores.length === 0}
                className="w-full sm:w-auto"
              >
                {isAssigning ? 'Assigning...' : 'Assign Chores for This Week'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 || chores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {members.length === 0 
                    ? 'Add household members to get started' 
                    : 'Add chores to assign to members'}
                </p>
              </div>
            ) : currentWeekAssignments.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Assignments for {formatDate(new Date(currentWeekAssignments[0].week_start_date))}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentWeekAssignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className={`p-4 rounded-lg border ${
                        assignment.is_completed 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={assignment.is_completed}
                          onCheckedChange={() => toggleAssignmentCompletion(assignment)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{assignment.chore.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Assigned to: {assignment.member.name}
                          </p>
                          {assignment.chore.description && (
                            <p className="text-sm mt-2">
                              {assignment.chore.description}
                            </p>
                          )}
                          {assignment.is_completed && assignment.completed_at && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                              Completed on {assignment.completed_at.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No assignments for this week. Click "Assign Chores for This Week" to generate assignments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground">
          <p>Built with ❤️ for household management</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
