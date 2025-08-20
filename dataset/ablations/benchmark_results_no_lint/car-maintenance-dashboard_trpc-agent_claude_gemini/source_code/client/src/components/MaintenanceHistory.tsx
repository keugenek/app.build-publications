import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Car, MaintenanceHistory as MaintenanceRecord, CreateMaintenanceHistoryInput, UpdateMaintenanceHistoryInput } from '../../../server/src/schema';

interface MaintenanceHistoryProps {
  car: Car;
}

export function MaintenanceHistory({ car }: MaintenanceHistoryProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [addFormData, setAddFormData] = useState<CreateMaintenanceHistoryInput>({
    car_id: car.id,
    service_date: new Date(),
    service_type: '',
    mileage: 0,
    cost: 0,
    notes: null
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateMaintenanceHistoryInput>>({});

  const loadMaintenanceRecords = useCallback(async () => {
    try {
      const records = await trpc.getMaintenanceHistoryByCar.query({ car_id: car.id });
      setMaintenanceRecords(records);
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
    }
  }, [car.id]);

  useEffect(() => {
    loadMaintenanceRecords();
  }, [loadMaintenanceRecords]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newRecord = await trpc.createMaintenanceHistory.mutate(addFormData);
      setMaintenanceRecords((prev: MaintenanceRecord[]) => [newRecord, ...prev]);
      setAddFormData({
        car_id: car.id,
        service_date: new Date(),
        service_type: '',
        mileage: 0,
        cost: 0,
        notes: null
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsLoading(true);
    try {
      const updateData = {
        id: editingRecord.id,
        ...editFormData
      } as UpdateMaintenanceHistoryInput;
      
      const updatedRecord = await trpc.updateMaintenanceHistory.mutate(updateData);
      setMaintenanceRecords((prev: MaintenanceRecord[]) =>
        prev.map((record: MaintenanceRecord) => record.id === updatedRecord.id ? updatedRecord : record)
      );
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update maintenance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteMaintenanceHistory.mutate({ id: recordId });
      setMaintenanceRecords((prev: MaintenanceRecord[]) =>
        prev.filter((record: MaintenanceRecord) => record.id !== recordId)
      );
    } catch (error) {
      console.error('Failed to delete maintenance record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setEditFormData({
      service_date: record.service_date,
      service_type: record.service_type,
      mileage: record.mileage,
      cost: record.cost,
      notes: record.notes
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const totalMaintenanceCost = maintenanceRecords.reduce((sum: number, record: MaintenanceRecord) => sum + record.cost, 0);
  const averageCostPerService = maintenanceRecords.length > 0 ? totalMaintenanceCost / maintenanceRecords.length : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              🔧 Maintenance History
            </CardTitle>
            <CardDescription>
              Service records for {car.year} {car.make} {car.model}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                ➕ Add Service Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Maintenance Record</DialogTitle>
                <DialogDescription>
                  Record a new service for {car.year} {car.make} {car.model}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-date">Service Date</Label>
                    <Input
                      id="service-date"
                      type="date"
                      value={formatDateForInput(addFormData.service_date)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAddFormData((prev: CreateMaintenanceHistoryInput) => ({ 
                          ...prev, 
                          service_date: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input
                      id="mileage"
                      type="number"
                      min="0"
                      placeholder="25000"
                      value={addFormData.mileage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAddFormData((prev: CreateMaintenanceHistoryInput) => ({ 
                          ...prev, 
                          mileage: parseInt(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-type">Service Type</Label>
                  <Input
                    id="service-type"
                    placeholder="Oil change, brake repair, etc."
                    value={addFormData.service_type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateMaintenanceHistoryInput) => ({ 
                        ...prev, 
                        service_type: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addFormData.cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddFormData((prev: CreateMaintenanceHistoryInput) => ({ 
                        ...prev, 
                        cost: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details about the service..."
                    value={addFormData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAddFormData((prev: CreateMaintenanceHistoryInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        {maintenanceRecords.length > 0 && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Total Records</div>
                <div className="text-2xl font-bold text-blue-600">{maintenanceRecords.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMaintenanceCost)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Avg. per Service</div>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(averageCostPerService)}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Maintenance Records */}
      {maintenanceRecords.length > 0 ? (
        <div className="space-y-4">
          {maintenanceRecords.map((record: MaintenanceRecord) => (
            <Card key={record.id} className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-gray-900">{record.service_type}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(record.service_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        🛣️ {record.mileage.toLocaleString()} miles
                      </span>
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        {formatCurrency(record.cost)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(record)}
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
                          <AlertDialogTitle>Delete Maintenance Record</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this {record.service_type} record from {formatDate(record.service_date)}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRecord(record.id)}
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
                {record.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                    <div className="text-sm text-gray-600">{record.notes}</div>
                  </div>
                )}
                <Separator className="mt-4" />
                <div className="text-xs text-gray-400 mt-2">
                  Added: {record.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <div className="text-4xl mb-4">🔧📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Maintenance Records</h3>
            <p className="text-gray-500 mb-4">
              Start tracking maintenance for your {car.year} {car.make} {car.model}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add First Service Record
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>
              Update the service record details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRecord} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service-date">Service Date</Label>
                <Input
                  id="edit-service-date"
                  type="date"
                  value={editFormData.service_date ? formatDateForInput(editFormData.service_date) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateMaintenanceHistoryInput>) => ({ 
                      ...prev, 
                      service_date: new Date(e.target.value) 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mileage">Mileage</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  min="0"
                  value={editFormData.mileage || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateMaintenanceHistoryInput>) => ({ 
                      ...prev, 
                      mileage: parseInt(e.target.value) || undefined 
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service-type">Service Type</Label>
              <Input
                id="edit-service-type"
                value={editFormData.service_type || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: Partial<UpdateMaintenanceHistoryInput>) => ({ 
                    ...prev, 
                    service_type: e.target.value 
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost ($)</Label>
              <Input
                id="edit-cost"
                type="number"
                min="0"
                step="0.01"
                value={editFormData.cost || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: Partial<UpdateMaintenanceHistoryInput>) => ({ 
                    ...prev, 
                    cost: parseFloat(e.target.value) || undefined 
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: Partial<UpdateMaintenanceHistoryInput>) => ({ 
                    ...prev, 
                    notes: e.target.value || null 
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
