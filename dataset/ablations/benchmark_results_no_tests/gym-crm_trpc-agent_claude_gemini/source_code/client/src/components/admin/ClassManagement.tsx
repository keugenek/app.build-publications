import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Users, Edit, Trash2, Plus, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Class, CreateClassInput, UpdateClassInput } from '../../../../server/src/schema';

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateClassInput>({
    name: '',
    description: null,
    instructor_name: '',
    duration_minutes: 60,
    max_capacity: 20,
    class_date: new Date(),
    start_time: '09:00',
    status: 'scheduled'
  });

  const [updateForm, setUpdateForm] = useState<UpdateClassInput>({
    id: 0,
    name: '',
    description: null,
    instructor_name: '',
    duration_minutes: 60,
    max_capacity: 20,
    class_date: new Date(),
    start_time: '09:00',
    status: 'scheduled'
  });

  // Load classes
  const loadClasses = useCallback(async () => {
    try {
      const result = await trpc.getClasses.query();
      setClasses(result);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Handle create class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const result = await trpc.createClass.mutate(createForm);
      setClasses((prev: Class[]) => [...prev, result]);
      
      // Reset form
      setCreateForm({
        name: '',
        description: null,
        instructor_name: '',
        duration_minutes: 60,
        max_capacity: 20,
        class_date: new Date(),
        start_time: '09:00',
        status: 'scheduled'
      });
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle update class
  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    setIsUpdating(editingClass.id);
    
    try {
      const result = await trpc.updateClass.mutate(updateForm);
      setClasses((prev: Class[]) => 
        prev.map(cls => cls.id === result.id ? result : cls)
      );
      setEditingClass(null);
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (cls: Class) => {
    setEditingClass(cls);
    setUpdateForm({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      instructor_name: cls.instructor_name,
      duration_minutes: cls.duration_minutes,
      max_capacity: cls.max_capacity,
      class_date: cls.class_date,
      start_time: cls.start_time,
      status: cls.status
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600';
      case 'in_progress':
        return 'bg-green-600';
      case 'completed':
        return 'bg-gray-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-slate-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Class */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="h-5 w-5 mr-2 text-orange-500" />
            Create New Class
          </CardTitle>
          <CardDescription className="text-slate-400">
            Schedule a new fitness class for members 🏃‍♀️
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class-name" className="text-slate-300">Class Name</Label>
                <Input
                  id="class-name"
                  value={createForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., Morning Yoga, HIIT Training"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="instructor-name" className="text-slate-300">Instructor Name</Label>
                <Input
                  id="instructor-name"
                  value={createForm.instructor_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, instructor_name: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Instructor's full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="class-date" className="text-slate-300">Class Date</Label>
                <Input
                  id="class-date"
                  type="date"
                  value={createForm.class_date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, class_date: new Date(e.target.value) }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="start-time" className="text-slate-300">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={createForm.start_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, start_time: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="duration" className="text-slate-300">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={createForm.duration_minutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="capacity" className="text-slate-300">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={createForm.max_capacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateClassInput) => ({ ...prev, max_capacity: parseInt(e.target.value) || 20 }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
              <Textarea
                id="description"
                value={createForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateForm((prev: CreateClassInput) => ({ ...prev, description: e.target.value || null }))
                }
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Brief description of the class..."
                rows={3}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isCreating ? 'Creating...' : 'Create Class'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-500" />
            All Classes
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage existing classes and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No classes scheduled yet. Create your first class above! 📅
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-300">Class</TableHead>
                    <TableHead className="text-slate-300">Date & Time</TableHead>
                    <TableHead className="text-slate-300">Instructor</TableHead>
                    <TableHead className="text-slate-300">Capacity</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls: Class) => {
                    const availableSpots = cls.max_capacity - cls.current_bookings;
                    
                    return (
                      <TableRow key={cls.id} className="border-slate-600">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{cls.name}</div>
                            {cls.description && (
                              <div className="text-sm text-slate-400 truncate max-w-[200px]">
                                {cls.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-300">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(cls.class_date)}
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              {cls.start_time} ({cls.duration_minutes}min)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-slate-300">
                            <User className="h-4 w-4 mr-1" />
                            {cls.instructor_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{cls.current_bookings}/{cls.max_capacity}</span>
                            <Badge 
                              variant={availableSpots > 0 ? 'default' : 'secondary'}
                              className={availableSpots > 0 ? 'bg-green-600' : 'bg-yellow-600'}
                            >
                              {availableSpots > 0 ? `${availableSpots} spots` : 'Full'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(cls.status)}>
                            {cls.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => openEditDialog(cls)}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Class</DialogTitle>
                                  <DialogDescription className="text-slate-300">
                                    Update class details and settings
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <form onSubmit={handleUpdateClass} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-slate-300">Class Name</Label>
                                      <Input
                                        value={updateForm.name || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Instructor</Label>
                                      <Input
                                        value={updateForm.instructor_name || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, instructor_name: e.target.value }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Date</Label>
                                      <Input
                                        type="date"
                                        value={updateForm.class_date ? updateForm.class_date.toISOString().split('T')[0] : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, class_date: new Date(e.target.value) }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Time</Label>
                                      <Input
                                        type="time"
                                        value={updateForm.start_time || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, start_time: e.target.value }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Duration (min)</Label>
                                      <Input
                                        type="number"
                                        min="15"
                                        step="15"
                                        value={updateForm.duration_minutes || 60}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300">Max Capacity</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={updateForm.max_capacity || 20}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setUpdateForm(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 20 }))
                                        }
                                        className="bg-slate-700 border-slate-600 text-white"
                                        required
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-slate-300">Status</Label>
                                    <Select 
                                      value={updateForm.status} 
                                      onValueChange={(value: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') =>
                                        setUpdateForm(prev => ({ ...prev, status: value }))
                                      }
                                    >
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-700 border-slate-600">
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-slate-300">Description</Label>
                                    <Textarea
                                      value={updateForm.description || ''}
                                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setUpdateForm(prev => ({ ...prev, description: e.target.value || null }))
                                      }
                                      className="bg-slate-700 border-slate-600 text-white"
                                      rows={3}
                                    />
                                  </div>
                                </form>
                                
                                <DialogFooter>
                                  <Button
                                    type="submit"
                                    onClick={handleUpdateClass}
                                    disabled={isUpdating === cls.id}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    {isUpdating === cls.id ? 'Updating...' : 'Update Class'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
