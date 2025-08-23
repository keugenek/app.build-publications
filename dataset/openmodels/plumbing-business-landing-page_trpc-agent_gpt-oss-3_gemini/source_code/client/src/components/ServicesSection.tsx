import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { Service } from '../../../server/src/schema';

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpc.getServices.query();
      setServices(data);
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return (
    <section className="py-16 px-4 bg-gray-50" id="services">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        {loading ? (
          <p className="text-center">Loading services...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
                <div className="mt-auto">
                  <p className="text-lg font-medium mb-2">${service.price.toFixed(2)}</p>
                  <Button asChild variant="outline">
                    <a href="#contact" className="inline-block">Get Quote</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
