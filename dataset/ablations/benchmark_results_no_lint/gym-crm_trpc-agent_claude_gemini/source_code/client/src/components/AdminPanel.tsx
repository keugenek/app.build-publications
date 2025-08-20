import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Users, Calendar, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Class, CreateClassInput, UpdateClassInput } from '../../../server/src/schema';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  classes: Class[];
  onRefresh: () => void;
}

export function AdminPanel({ currentUser, users, classes, onRefresh }: AdminPanelProps) {
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState<CreateClassInput>({
    name: '',
    description: null,
    start_time: new Date(),
    end_time: new Date(),
    instructor_id: 1,
    max_capacity: 20
  });

  const instructors = users.filter((user: User) => user.role === 'instructor');
  const members = users.filter((user: User) => user.role === 'member');
  const admins = users.filter((user: User) => user.role === 'admin');

  // Handle creating a new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingClass(true);
    try {
      await trpc.createClass.mutate(newClass);
      setNewClass({
        name: '',
        description: null,
        start_time: new Date(),
        end_time: new Date(),
        instructor_id: instructors.length > 0 ? instructors[0].id : 1,
        max_capacity: 20
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Handle updating a class
  const handleUpdateClass = async (classToUpdate: Class) => {
    setIsUpdatingClass(true);
    try {
      const updateData: UpdateClassInput = {
        id: classToUpdate.id,
        name: classToUpdate.name,
        description: classToUpdate.description,
        start_time: new Date(classToUpdate.start_time),
        end_time: new Date(classToUpdate.end_time),
        instructor_id: classToUpdate.instructor_id,
        max_capacity: classToUpdate.max_capacity
      };
      await trpc.updateClass.mutate(updateData);
      setEditingClass(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsUpdatingClass(false);
    }
  };

  // Handle deleting a class
  const handleDeleteClass = async (classId: number) => {
    setIsDeletingClass(true);
    try {
      await trpc.deleteClass.mutate({ id: classId });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete class:', error);
    } finally {
      setIsDeletingClass(false);
    }
  };

  // Format date for input fields
  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚙️</div>
            <div>
              <CardTitle className="text-xl">Admin Dashboard</CardTitle>
              <CardDescription>
                Manage your gym's classes, instructors, and members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-blue-500 mb-2">👥</div>
            <div className="text-2xl font-bold text-blue-600">{members.length}</div>
            <div className="text-sm text-gray-600">Members</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-green-500 mb-2">🏃‍♂️</div>
            <div className="text-2xl font-bold text-green-600">{instructors.length}</div>
            <div className="text-sm text-gray-600">Instructors</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-purple-500 mb-2">📅</div>
            <div className="text-2xl font-bold text-purple-600">{classes.length}</div>
            <div className="text-sm text-gray-600">Classes</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-red-500 mb-2">👨‍💼</div>
            <div className="text-2xl font-bold text-red-600">{admins.length}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border-2 border-orange-200">
          <TabsTrigger value="classes" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📅 Classes
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            👥 Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            📊 Analytics
          </TabsTrigger>
        </TabsList>

        {/* Classes Management */}
        <TabsContent value="classes" className="mt-4">
          <div className="space-y-4">
            {/* Create New Class Form */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-orange-500" />
                  Create New Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name</Label>
                      <Input
                        id="className"
                        placeholder="e.g., Morning Yoga, HIIT Training"
                        value={newClass.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewClass((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCapacity">Max Capacity</Label>
                      <Input
                        id="maxCapacity"
                        type="number"
                        min="1"
                        value={newClass.max_capacity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewClass((prev: CreateClassInput) => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the class..."
                      value={newClass.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewClass((prev: CreateClassInput) => ({ ...prev, description: e.target.value || null }))
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructor">Instructor</Label>
                      <Select 
                        value={newClass.instructor_id.toString()} 
                        onValueChange={(value: string) => 
                          setNewClass((prev: CreateClassInput) => ({ ...prev, instructor_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor: User) => (
                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formatDateForInput(newClass.start_time)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewClass((prev: CreateClassInput) => ({ ...prev, start_time: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formatDateForInput(newClass.end_time)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewClass((prev: CreateClassInput) => ({ ...prev, end_time: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isCreatingClass}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isCreatingClass ? 'Creating...' : 'Create Class 🏋️'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Classes */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Existing Classes ({classes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No classes created yet</p>
                    <p className="text-sm mt-1">Create your first class above!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls: Class) => {
                      const startTime = new Date(cls.start_time);
                      const endTime = new Date(cls.end_time);
                      const instructor = users.find((u: User) => u.id === cls.instructor_id);

                      return (
                        <Card key={cls.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                                  <Badge variant="outline">ID: {cls.id}</Badge>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>📅 {startTime.toLocaleString()} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  <div>👨‍🏫 Instructor: {instructor?.name || 'Unknown'}</div>
                                  <div>👥 Max Capacity: {cls.max_capacity}</div>
                                  {cls.description && <div>📝 {cls.description}</div>}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setEditingClass(cls)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Class: {cls.name}</DialogTitle>
                                      <DialogDescription>
                                        Make changes to the class details
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingClass && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Class Name</Label>
                                          <Input
                                            value={editingClass.name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                              setEditingClass((prev: Class | null) => prev ? { ...prev, name: e.target.value } : null)
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Max Capacity</Label>
                                          <Input
                                            type="number"
                                            value={editingClass.max_capacity}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                              setEditingClass((prev: Class | null) => prev ? { ...prev, max_capacity: parseInt(e.target.value) || 1 } : null)
                                            }
                                          />
                                        </div>
                                        <Button 
                                          onClick={() => handleUpdateClass(editingClass)}
                                          disabled={isUpdatingClass}
                                          className="bg-orange-500 hover:bg-orange-600"
                                        >
                                          {isUpdatingClass ? 'Updating...' : 'Update Class'}
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{cls.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteClass(cls.id)}
                                        disabled={isDeletingClass}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        {isDeletingClass ? 'Deleting...' : 'Delete'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="mt-4">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all gym users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: User) => (
                  <Card key={user.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'instructor' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            📧 {user.email} • 🆔 {user.id} • 📅 Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-2xl">
                          {user.role === 'admin' ? '👨‍💼' : user.role === 'instructor' ? '🏃‍♂️' : '👤'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Gym Analytics
              </CardTitle>
              <CardDescription>
                Overview of your gym's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Analytics coming soon!</p>
                <p className="text-sm mt-1">We're working on detailed reports and insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
