import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Service } from '../../../server/src/schema';

export function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trpc.getServices.query();
      setServices(data);
    } catch (e) {
      setError('Failed to load services');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  if (loading) {
    return <p className="text-gray-500">Loading services...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id} className="flex flex-col justify-between h-full">
          <CardHeader>
            <CardTitle>{service.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-gray-700 mb-2">{service.description}</p>
            {service.price != null && (
              <p className="text-primary font-semibold">${service.price.toFixed(2)}</p>
            )}
          </CardContent>
          <div className="p-4">
            <Button variant="outline">Learn More</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
