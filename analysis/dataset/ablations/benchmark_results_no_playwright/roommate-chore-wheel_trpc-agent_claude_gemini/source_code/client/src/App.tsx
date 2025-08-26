import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, Users, ListTodo, Calendar, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  Member, 
  CreateMemberInput, 
  Chore, 
  CreateChoreInput, 
  AssignmentWithDetails,
  MarkAssignmentCompletedInput,
  GenerateWeeklyAssignmentsInput 
} from '../../server/src/schema';

function App() {
  // State for data
  const [members, setMembers] = useState<Member[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [memberForm, setMemberForm] = useState<CreateMemberInput>({
    name: ''
  });
  
  const [choreForm, setChoreForm] = useState<CreateChoreInput>({
    name: '',
    description: null
  });

  // Current week calculation
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday the start
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    return weekStart.toISOString().split('T')[0];
  };

  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());

  // Data loading functions
  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getMembers.query();
      setMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, []);

  const loadChores = useCallback(async () => {
    try {
      const result = await trpc.getChores.query();
      setChores(result);
    } catch (error) {
      console.error('Failed to load chores:', error);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      const result = await trpc.getWeeklyAssignments.query({ 
        week_start: currentWeek 
      });
      setAssignments(result);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, [currentWeek]);

  // Load all data on mount
  useEffect(() => {
    loadMembers();
    loadChores();
    loadAssignments();
  }, [loadMembers, loadChores, loadAssignments]);

  // Member management
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;
    
    setIsLoading(true);
    try {
      const newMember = await trpc.createMember.mutate(memberForm);
      setMembers((prev: Member[]) => [...prev, newMember]);
      setMemberForm({ name: '' });
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chore management
  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreForm.name.trim()) return;
    
    setIsLoading(true);
    try {
      const newChore = await trpc.createChore.mutate(choreForm);
      setChores((prev: Chore[]) => [...prev, newChore]);
      setChoreForm({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create chore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Assignment management
  const handleGenerateAssignments = async () => {
    setIsLoading(true);
    try {
      const input: GenerateWeeklyAssignmentsInput = { week_start: currentWeek };
      await trpc.generateWeeklyAssignments.mutate(input);
      await loadAssignments(); // Reload assignments after generation
    } catch (error) {
      console.error('Failed to generate assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (assignmentId: number, currentStatus: boolean) => {
    if (currentStatus) return; // Don't allow uncompleting tasks
    
    try {
      const input: MarkAssignmentCompletedInput = { assignment_id: assignmentId };
      await trpc.markAssignmentCompleted.mutate(input);
      
      // Update local state
      setAssignments((prev: AssignmentWithDetails[]) =>
        prev.map((assignment: AssignmentWithDetails) =>
          assignment.id === assignmentId
            ? { ...assignment, is_completed: true, completed_at: new Date() }
            : assignment
        )
      );
    } catch (error) {
      console.error('Failed to mark assignment as completed:', error);
    }
  };

  // Week navigation
  const changeWeek = (direction: 'prev' | 'next') => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(date.toISOString().split('T')[0]);
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const completedCount = assignments.filter((a: AssignmentWithDetails) => a.is_completed).length;
  const totalCount = assignments.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏠 Household Chores</h1>
          <p className="text-lg text-gray-600">Keep your home organized, one chore at a time!</p>
        </div>

        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="chores" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Chores
            </TabsTrigger>
          </TabsList>

          {/* Weekly Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">📅 Week of {formatWeekRange(currentWeek)}</CardTitle>
                    <CardDescription>
                      {totalCount > 0 ? (
                        <span className="text-lg">
                          {completedCount} of {totalCount} chores completed 
                          <span className="ml-2">
                            {completedCount === totalCount ? '🎉' : '💪'}
                          </span>
                        </span>
                      ) : (
                        'No assignments for this week yet'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => changeWeek('prev')}
                      className="px-3"
                    >
                      ← Prev
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => changeWeek('next')}
                      className="px-3"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    {members.length === 0 || chores.length === 0 ? (
                      <div className="space-y-4">
                        <div className="text-6xl">🚀</div>
                        <h3 className="text-xl font-medium text-gray-700">Ready to get started?</h3>
                        <p className="text-gray-600">
                          {members.length === 0 && chores.length === 0
                            ? 'Add some household members and chores first, then generate weekly assignments!'
                            : members.length === 0
                            ? 'Add household members to get started with assignments!'
                            : 'Add some chores to get started with assignments!'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-6xl">✨</div>
                        <h3 className="text-xl font-medium text-gray-700">Generate This Week's Assignments</h3>
                        <p className="text-gray-600 mb-4">
                          Ready to assign chores to household members for this week!
                        </p>
                        <Button 
                          onClick={handleGenerateAssignments}
                          disabled={isLoading}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          {isLoading ? 'Generating...' : '🎲 Generate Weekly Assignments'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Progress bar */}
                    {totalCount > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Assignment cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {assignments.map((assignment: AssignmentWithDetails) => (
                        <Card 
                          key={assignment.id} 
                          className={`transition-all duration-200 hover:shadow-md ${
                            assignment.is_completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">
                                  {assignment.chore.name}
                                </h3>
                                <p className="text-sm text-blue-600 font-medium">
                                  👤 {assignment.member.name}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleComplete(assignment.id, assignment.is_completed)}
                                disabled={assignment.is_completed}
                                className={`p-1 ${
                                  assignment.is_completed 
                                    ? 'text-green-600' 
                                    : 'text-gray-400 hover:text-green-600'
                                }`}
                              >
                                {assignment.is_completed ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  <Circle className="w-6 h-6" />
                                )}
                              </Button>
                            </div>
                            
                            {assignment.chore.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {assignment.chore.description}
                              </p>
                            )}
                            
                            {assignment.is_completed && assignment.completed_at && (
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                  ✅ Completed {new Date(assignment.completed_at).toLocaleDateString()}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Generate new assignments button */}
                    <div className="pt-4">
                      <Separator className="mb-4" />
                      <div className="flex justify-center">
                        <Button 
                          onClick={handleGenerateAssignments}
                          disabled={isLoading}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          🎲 Regenerate Assignments for This Week
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">👥 Household Members</CardTitle>
                <CardDescription>
                  Add and manage the people in your household who will be assigned chores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMember} className="flex gap-4 mb-6">
                  <Input
                    placeholder="Enter member name (e.g., Sarah, Mom, Dad)"
                    value={memberForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMemberForm((prev: CreateMemberInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !memberForm.name.trim()}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </form>

                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No household members yet</h3>
                    <p className="text-gray-600">
                      Add family members, roommates, or anyone who will help with chores!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((member: Member) => (
                      <Card key={member.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{member.name}</h3>
                              <p className="text-sm text-gray-600">
                                Added {member.created_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chores Tab */}
          <TabsContent value="chores" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">🧹 Household Chores</CardTitle>
                <CardDescription>
                  Define the chores that need to be done regularly in your household
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChore} className="space-y-4 mb-6">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Chore name (e.g., Take out trash, Clean bathroom)"
                      value={choreForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setChoreForm((prev: CreateChoreInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !choreForm.name.trim()}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Chore
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Optional description (e.g., Include recycling bins, clean mirror and sink)"
                    value={choreForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setChoreForm((prev: CreateChoreInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={2}
                  />
                </form>

                {chores.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🧽</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No chores defined yet</h3>
                    <p className="text-gray-600">
                      Add household chores like cleaning, cooking, maintenance, and more!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {chores.map((chore: Chore) => (
                      <Card key={chore.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900 mb-2">{chore.name}</h3>
                          {chore.description && (
                            <p className="text-sm text-gray-600 mb-3">{chore.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Added {chore.created_at.toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
