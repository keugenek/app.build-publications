import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Trash2, Wrench } from 'lucide-react';
import type { MaintenanceRecord, Car, ServiceType } from '../../../server/src/schema';

interface MaintenanceHistoryProps {
  records: MaintenanceRecord[];
  cars: Car[];
  showCarInfo?: boolean;
  onRecordUpdated: () => void;
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

export function MaintenanceHistory({ records, cars, showCarInfo = false, onRecordUpdated }: MaintenanceHistoryProps) {
  const handleDeleteRecord = async (recordId: number) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await trpc.deleteMaintenanceRecord.mutate({ id: recordId });
        onRecordUpdated();
      } catch (error) {
        console.error('Failed to delete maintenance record:', error);
      }
    }
  };

  const getCar = (carId: number) => cars.find((car: Car) => car.id === carId);

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">No maintenance records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record: MaintenanceRecord) => {
        const car = getCar(record.car_id);
        return (
          <div key={record.id} className="border rounded-lg p-4 bg-white/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {serviceTypeEmojis[record.service_type]}
                  </span>
                  <h4 className="font-medium text-gray-900">
                    {formatServiceType(record.service_type)}
                  </h4>
                  {showCarInfo && car && (
                    <Badge variant="outline" className="text-xs">
                      {car.year} {car.make} {car.model}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{record.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Date:</span> {record.service_date.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span> ${record.cost.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Mileage:</span> {record.mileage.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Added:</span> {record.created_at.toLocaleDateString()}
                  </div>
                </div>
                
                {record.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Notes:</strong> {record.notes}
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteRecord(record.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
