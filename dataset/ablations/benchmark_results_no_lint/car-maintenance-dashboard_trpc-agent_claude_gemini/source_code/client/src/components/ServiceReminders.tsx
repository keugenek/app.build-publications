import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Car, ServiceReminder, CreateServiceReminderInput, UpdateServiceReminderInput } from '../../../server/src/schema';

interface ServiceRemindersProps {
  car: Car;
}

export function ServiceReminders({ car }: ServiceRemindersProps) {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ServiceReminder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addFormData, setAddFormData] = useState<CreateServiceReminderInput>({
    car_id: car.id,
    due_date: new Date(),
    service_description: '',
    is_completed: false
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateServiceReminderInput>>({});

  const loadReminders = useCallback(async () => {
    try {
      const result = await trpc.getServiceRemindersByCar.query({ car_id: car.id });
      setReminders(result);
    } catch (error) {
      console.error('Failed to load service reminders:', error);
    }
  }, [car.id]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newReminder = await trpc.createServiceReminder.mutate(addFormData);
      setReminders((prev: ServiceReminder[]) => [newReminder, ...prev]);
      setAddFormData({
        car_id: car.id,
        due_date: new Date(),
        service_description: '',
        is_completed: false
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create service reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingReminder.id,
        ...editFormData
      } as UpdateServiceReminderInput;
      
      const updatedReminder = await trpc.updateServiceReminder.mutate(updateData);
      setReminders((prev: ServiceReminder[]) =>
        prev.map((reminder: ServiceReminder) => reminder.id === updatedReminder.id ? updatedReminder : reminder)
      );
      setIsEditDialogOpen(false);
      setEditingReminder(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update service reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (reminderId: number, isCompleted: boolean) => {
    setIsLoading(true);
    try {
      const updatedReminder = await trpc.updateServiceReminder.mutate({
        id: reminderId,
        is_completed: isCompleted
      });
      setReminders((prev: ServiceReminder[]) =>
        prev.map((reminder: ServiceReminder) => reminder.id === reminderId ? updatedReminder : reminder)
      );
    } catch (error) {
      console.error('Failed to toggle reminder completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteServiceReminder.mutate({ id: reminderId });
      setReminders((prev: ServiceReminder[]) =>
        prev.filter((reminder: ServiceReminder) => reminder.id !== reminderId)
      );
    } catch (error) {
      console.error('Failed to delete service reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (reminder: ServiceReminder) => {
    setEditingReminder(reminder);
    setEditFormData({
      due_date: reminder.due_date,
      service_description: reminder.service_description,
      is_completed: reminder.is_completed
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueBadge = (dueDate: Date, isCompleted: boolean) => {
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Completed</Badge>;
    }

    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) {
      return <Badge variant="destructive">⚠️ Overdue ({Math.abs(daysUntil)} days)</Badge>;
    } else if (daysUntil === 0) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">📅 Due Today</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏰ Due in {daysUntil} days</Badge>;
    } else {
      return <Badge variant="outline">{daysUntil} days remaining</Badge>;
    }
  };

  const completedReminders = reminders.filter((r: ServiceReminder) => r.is_completed);
  const pendingReminders = reminders.filter((r: ServiceReminder) => !r.is_completed);
  const overdueReminders = pendingReminders.filter((r: ServiceReminder) => getDaysUntilDue(r.due_date) < 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              ⏰ Service Reminders
            </CardTitle>
            <CardDescription>
              Upcoming services for {car.year} {car.make} {car.model}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                ➕ Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Service Reminder</DialogTitle>
                <DialogDescription>
                  Set up a new service reminder for {car.year} {car.make} {car.model}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formatDateForInput(addFormData.due_date)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateServiceReminderInput) => ({ 
                        ...prev, 
                        due_date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-description">Service Description</Label>
                  <Textarea
                    id="service-description"
                    placeholder="Oil change, tire rotation, inspection, etc."
                    value={addFormData.service_description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAddFormData((prev: CreateServiceReminderInput) => ({ 
                        ...prev, 
                        service_description: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Reminder'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        {reminders.length > 0 && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-blue-600">{reminders.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-orange-600">{pendingReminders.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{overdueReminders.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-green-600">{completedReminders.length}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Service Reminders */}
      {reminders.length > 0 ? (
        <div className="space-y-4">
          {reminders
            .sort((a: ServiceReminder, b: ServiceReminder) => {
              // Sort by completion status first (pending first), then by due date
              if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1;
              }
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            })
            .map((reminder: ServiceReminder) => (
            <Card key={reminder.id} className={`bg-white/80 backdrop-blur-sm border-slate-200 ${
              reminder.is_completed ? 'opacity-75' : ''
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox
                      checked={reminder.is_completed}
                      onCheckedChange={(checked: boolean) => 
                        handleToggleComplete(reminder.id, checked)
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className={`font-semibold text-lg ${
                          reminder.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {reminder.service_description}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            📅 Due: {formatDate(reminder.due_date)}
                          </span>
                          {getDueBadge(reminder.due_date, reminder.is_completed)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(reminder)}
                        >
                          ✏️ Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                              🗑️ Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Service Reminder</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this service reminder for "{reminder.service_description}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReminder(reminder.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isLoading}
                              >
                                {isLoading ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-xs text-gray-400">
                      Created: {reminder.created_at.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <div className="text-4xl mb-4">⏰📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Reminders</h3>
            <p className="text-gray-500 mb-4">
              Set up reminders for upcoming services on your {car.year} {car.make} {car.model}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add First Reminder
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service Reminder</DialogTitle>
            <DialogDescription>
              Update the reminder details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditReminder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-due-date">Due Date</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={editFormData.due_date ? formatDateForInput(editFormData.due_date) : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: Partial<UpdateServiceReminderInput>) => ({ 
                    ...prev, 
                    due_date: new Date(e.target.value) 
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service-description">Service Description</Label>
              <Textarea
                id="edit-service-description"
                value={editFormData.service_description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: Partial<UpdateServiceReminderInput>) => ({ 
                    ...prev, 
                    service_description: e.target.value 
                  }))
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-completed"
                checked={editFormData.is_completed || false}
                onCheckedChange={(checked: boolean) =>
                  setEditFormData((prev: Partial<UpdateServiceReminderInput>) => ({ 
                    ...prev, 
                    is_completed: checked 
                  }))
                }
              />
              <Label htmlFor="edit-completed">Mark as completed</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Reminder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
