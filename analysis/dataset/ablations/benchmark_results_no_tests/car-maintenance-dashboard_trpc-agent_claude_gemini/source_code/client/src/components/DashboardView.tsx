import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Car as CarIcon, Wrench, Calendar, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import type { Car as CarType, ServiceSchedule } from '../../../server/src/schema';

interface DashboardViewProps {
  cars: CarType[];
  upcomingServices: ServiceSchedule[];
  onRefresh: () => void;
}

export function DashboardView({ cars, upcomingServices, onRefresh }: DashboardViewProps) {
  // Calculate dashboard statistics
  const totalCars = cars.length;
  const averageMileage = cars.length > 0 
    ? Math.round(cars.reduce((sum, car) => sum + car.current_mileage, 0) / cars.length)
    : 0;
  
  // Get services due soon (mileage-based services where current mileage is close to next service)
  const servicesDueSoon = upcomingServices.filter((service) => {
    const car = cars.find((c) => c.id === service.car_id);
    if (!car || !service.next_service_mileage) return false;
    
    const mileageUntilService = service.next_service_mileage - car.current_mileage;
    return mileageUntilService <= 1000 && mileageUntilService >= 0;
  });

  const overdueServices = upcomingServices.filter((service) => {
    const car = cars.find((c) => c.id === service.car_id);
    if (!car) return false;
    
    if (service.next_service_mileage) {
      return car.current_mileage >= service.next_service_mileage;
    }
    
    if (service.next_service_date) {
      return new Date() >= service.next_service_date;
    }
    
    return false;
  });

  const getServiceUrgency = (service: ServiceSchedule): 'overdue' | 'due-soon' | 'upcoming' => {
    const car = cars.find((c) => c.id === service.car_id);
    if (!car) return 'upcoming';
    
    if (service.next_service_mileage) {
      const mileageUntilService = service.next_service_mileage - car.current_mileage;
      if (mileageUntilService <= 0) return 'overdue';
      if (mileageUntilService <= 1000) return 'due-soon';
    }
    
    if (service.next_service_date) {
      const daysUntilService = Math.ceil(
        (service.next_service_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilService <= 0) return 'overdue';
      if (daysUntilService <= 30) return 'due-soon';
    }
    
    return 'upcoming';
  };

  const getCarName = (carId: number): string => {
    const car = cars.find((c) => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car';
  };

  const getServiceProgress = (service: ServiceSchedule): number => {
    const car = cars.find((c) => c.id === service.car_id);
    if (!car || !service.last_service_mileage || !service.next_service_mileage) return 0;
    
    const totalInterval = service.next_service_mileage - service.last_service_mileage;
    const currentProgress = car.current_mileage - service.last_service_mileage;
    
    return Math.min(100, Math.max(0, (currentProgress / totalInterval) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Cars</CardTitle>
            <CarIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalCars}</div>
            <p className="text-xs text-blue-600 mt-1">
              {totalCars === 0 ? 'No cars registered' : 'Vehicles in fleet'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Average Mileage</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {averageMileage.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Miles per vehicle</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Due Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{servicesDueSoon.length}</div>
            <p className="text-xs text-orange-600 mt-1">Services within 1000 miles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{overdueServices.length}</div>
            <p className="text-xs text-red-600 mt-1">Services past due</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-gray-600" />
              <CardTitle>Upcoming Services</CardTitle>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No scheduled services</p>
              <p className="text-sm">Add service schedules for your cars to see upcoming maintenance</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingServices
                .sort((a, b) => {
                  // Sort by urgency first, then by due date/mileage
                  const urgencyA = getServiceUrgency(a);
                  const urgencyB = getServiceUrgency(b);
                  const urgencyOrder = { 'overdue': 0, 'due-soon': 1, 'upcoming': 2 };
                  
                  if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
                    return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
                  }
                  
                  // If same urgency, sort by next service mileage/date
                  if (a.next_service_mileage && b.next_service_mileage) {
                    return a.next_service_mileage - b.next_service_mileage;
                  }
                  
                  return 0;
                })
                .map((service) => {
                  const urgency = getServiceUrgency(service);
                  const car = cars.find((c) => c.id === service.car_id);
                  const progress = getServiceProgress(service);
                  
                  return (
                    <div
                      key={service.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        urgency === 'overdue'
                          ? 'bg-red-50 border-l-red-500'
                          : urgency === 'due-soon'
                          ? 'bg-orange-50 border-l-orange-500'
                          : 'bg-blue-50 border-l-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.service_type}</h3>
                          <p className="text-sm text-gray-600">{getCarName(service.car_id)}</p>
                        </div>
                        <Badge
                          variant={
                            urgency === 'overdue'
                              ? 'destructive'
                              : urgency === 'due-soon'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {urgency === 'overdue'
                            ? '🚨 Overdue'
                            : urgency === 'due-soon'
                            ? '⚠️ Due Soon'
                            : '📅 Scheduled'}
                        </Badge>
                      </div>
                      
                      {service.next_service_mileage && car && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current: {car.current_mileage.toLocaleString()} miles</span>
                            <span>Due: {service.next_service_mileage.toLocaleString()} miles</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {service.next_service_mileage - car.current_mileage > 0
                              ? `${(service.next_service_mileage - car.current_mileage).toLocaleString()} miles remaining`
                              : `${(car.current_mileage - service.next_service_mileage).toLocaleString()} miles overdue`}
                          </p>
                        </div>
                      )}
                      
                      {service.next_service_date && !service.next_service_mileage && (
                        <div className="text-sm text-gray-600">
                          <p>Due: {service.next_service_date.toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fleet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarIcon className="h-5 w-5 text-gray-600" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No cars in fleet</p>
              <p className="text-sm">Add your first car to get started with maintenance tracking</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cars.map((car) => {
                const carServices = upcomingServices.filter((s) => s.car_id === car.id);
                const overdueCount = carServices.filter((s) => getServiceUrgency(s) === 'overdue').length;
                const dueSoonCount = carServices.filter((s) => getServiceUrgency(s) === 'due-soon').length;
                
                return (
                  <div key={car.id} className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-sm text-gray-600">🚗 {car.license_plate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{car.current_mileage.toLocaleString()} miles</p>
                        <p className="text-xs text-gray-500">Current mileage</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {overdueCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {overdueCount} overdue
                        </Badge>
                      )}
                      {dueSoonCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dueSoonCount} due soon
                        </Badge>
                      )}
                      {overdueCount === 0 && dueSoonCount === 0 && carServices.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          ✅ Up to date
                        </Badge>
                      )}
                      {carServices.length === 0 && (
                        <Badge variant="outline" className="text-xs">
                          No schedules
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
