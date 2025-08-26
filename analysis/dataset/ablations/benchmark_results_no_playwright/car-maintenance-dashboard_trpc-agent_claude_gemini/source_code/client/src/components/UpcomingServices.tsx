import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Trash2, CheckCircle, Calendar } from 'lucide-react';
import type { UpcomingService, Car, ServiceType } from '../../../server/src/schema';

interface UpcomingServicesProps {
  services: UpcomingService[];
  cars: Car[];
  showCarInfo?: boolean;
  onServiceUpdated: () => void;
}

const serviceTypeEmojis: Record<ServiceType, string> = {
  'oil_change': '🛢️',
  'tire_rotation': '🛞',
  'brake_service': '🛑',
  'engine_tune_up': '🔧',
  'transmission_service': '⚙️',
  'coolant_flush': '🌊',
  'air_filter_replacement': '💨',
  'battery_replacement': '🔋',
  'inspection': '🔍',
  'other': '🔨'
};

const formatServiceType = (type: ServiceType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export function UpcomingServices({ services, cars, showCarInfo = false, onServiceUpdated }: UpcomingServicesProps) {
  const handleDeleteService = async (serviceId: number) => {
    if (window.confirm('Are you sure you want to delete this upcoming service?')) {
      try {
        await trpc.deleteUpcomingService.mutate({ id: serviceId });
        onServiceUpdated();
      } catch (error) {
        console.error('Failed to delete upcoming service:', error);
      }
    }
  };

  const handleCompleteService = async (serviceId: number) => {
    try {
      await trpc.updateUpcomingService.mutate({ 
        id: serviceId, 
        is_completed: true 
      });
      onServiceUpdated();
    } catch (error) {
      console.error('Failed to complete service:', error);
    }
  };

  const getCar = (carId: number) => cars.find((car: Car) => car.id === carId);

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (daysUntil: number, isCompleted: boolean) => {
    if (isCompleted) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Completed</Badge>;
    }
    
    if (daysUntil < 0) {
      return <Badge variant="destructive">⚠️ Overdue</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800">🔥 Due Soon</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge variant="outline" className="border-yellow-400 text-yellow-700">⚡ Upcoming</Badge>;
    }
    
    return <Badge variant="outline">📅 Scheduled</Badge>;
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">No upcoming services scheduled</p>
      </div>
    );
  }

  // Sort services by due date
  const sortedServices = [...services].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedServices.map((service: UpcomingService) => {
        const car = getCar(service.car_id);
        const daysUntil = getDaysUntilDue(service.due_date);
        
        return (
          <div key={service.id} className="border rounded-lg p-4 bg-white/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {serviceTypeEmojis[service.service_type]}
                  </span>
                  <h4 className="font-medium text-gray-900">
                    {formatServiceType(service.service_type)}
                  </h4>
                  {showCarInfo && car && (
                    <Badge variant="outline" className="text-xs">
                      {car.year} {car.make} {car.model}
                    </Badge>
                  )}
                  {getUrgencyBadge(daysUntil, service.is_completed)}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{service.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Due Date:</span> {service.due_date.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Days Until Due:</span>{' '}
                    {service.is_completed ? (
                      <span className="text-green-600">Completed</span>
                    ) : daysUntil < 0 ? (
                      <span className="text-red-600 font-medium">{Math.abs(daysUntil)} days overdue</span>
                    ) : daysUntil === 0 ? (
                      <span className="text-orange-600 font-medium">Due today</span>
                    ) : (
                      <span className={daysUntil <= 7 ? "text-orange-600 font-medium" : ""}>
                        {daysUntil} days
                      </span>
                    )}
                  </div>
                  {service.due_mileage && (
                    <div>
                      <span className="font-medium">Due Mileage:</span> {service.due_mileage.toLocaleString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Scheduled:</span> {service.created_at.toLocaleDateString()}
                  </div>
                </div>
                
                {service.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Notes:</strong> {service.notes}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!service.is_completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleCompleteService(service.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteService(service.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
