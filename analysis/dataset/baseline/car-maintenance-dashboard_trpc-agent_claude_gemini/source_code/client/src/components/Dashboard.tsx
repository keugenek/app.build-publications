import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Car, MaintenanceEntry, ServiceReminder } from '../../../server/src/schema';

interface DashboardProps {
  cars: Car[];
  isLoadingCars: boolean;
}

export function Dashboard({ cars, isLoadingCars }: DashboardProps) {
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ServiceReminder[]>([]);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  const loadMaintenanceEntries = useCallback(async () => {
    setIsLoadingMaintenance(true);
    try {
      const result = await trpc.getAllMaintenanceEntries.query();
      setMaintenanceEntries(result);
    } catch (error) {
      console.error('Failed to load maintenance entries:', error);
    } finally {
      setIsLoadingMaintenance(false);
    }
  }, []);

  const loadUpcomingReminders = useCallback(async () => {
    setIsLoadingReminders(true);
    try {
      const result = await trpc.getUpcomingServiceReminders.query();
      setUpcomingReminders(result);
    } catch (error) {
      console.error('Failed to load upcoming reminders:', error);
    } finally {
      setIsLoadingReminders(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenanceEntries();
    loadUpcomingReminders();
  }, [loadMaintenanceEntries, loadUpcomingReminders]);

  // Calculate statistics
  const totalMaintenanceCost = maintenanceEntries.reduce((sum: number, entry: MaintenanceEntry) => sum + entry.cost, 0);
  const recentMaintenance = maintenanceEntries
    .sort((a: MaintenanceEntry, b: MaintenanceEntry) => 
      new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    )
    .slice(0, 5);

  const getServiceTypeDisplay = (serviceType: string) => {
    return serviceType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCarName = (carId: number) => {
    const car = cars.find((c: Car) => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingCars ? '...' : cars.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Maintenance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingMaintenance ? '...' : maintenanceEntries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isLoadingMaintenance ? '...' : `$${totalMaintenanceCost.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingReminders ? '...' : upcomingReminders.filter((r: ServiceReminder) => !r.is_completed).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Recent Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMaintenance ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : recentMaintenance.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No maintenance records yet. Add some in the Maintenance tab!
              </div>
            ) : (
              <div className="space-y-3">
                {recentMaintenance.map((entry: MaintenanceEntry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{getCarName(entry.car_id)}</p>
                      <p className="text-sm text-gray-600">{getServiceTypeDisplay(entry.service_type)}</p>
                      <p className="text-xs text-gray-500">
                        {entry.service_date.toLocaleDateString()} • {entry.mileage.toLocaleString()} miles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${entry.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Service Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>⏰ Upcoming Service Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReminders ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : upcomingReminders.filter((r: ServiceReminder) => !r.is_completed).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No upcoming reminders. Add some in the Reminders tab!
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders
                  .filter((reminder: ServiceReminder) => !reminder.is_completed)
                  .slice(0, 5)
                  .map((reminder: ServiceReminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium text-gray-900">{getCarName(reminder.car_id)}</p>
                        <p className="text-sm text-gray-600">{getServiceTypeDisplay(reminder.service_type)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {reminder.reminder_type === 'date_based' ? 'Date Based' : 'Mileage Based'}
                          </Badge>
                          {reminder.due_date && (
                            <span className="text-xs text-gray-500">
                              Due: {reminder.due_date.toLocaleDateString()}
                            </span>
                          )}
                          {reminder.due_mileage && (
                            <span className="text-xs text-gray-500">
                              Due: {reminder.due_mileage.toLocaleString()} miles
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cars Overview */}
      {!isLoadingCars && cars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🚗 Your Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car: Car) => (
                <div key={car.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-sm text-gray-600">License: {car.license_plate}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Added: {car.created_at.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
