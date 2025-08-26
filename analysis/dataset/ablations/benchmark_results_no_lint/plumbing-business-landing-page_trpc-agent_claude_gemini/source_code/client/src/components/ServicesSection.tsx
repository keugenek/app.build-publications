import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Service } from '../../../server/src/schema';

// Default services to display when API returns empty (since handlers are stubs)
const defaultServices: Service[] = [
  {
    id: 1,
    name: "Emergency Plumbing Repairs",
    description: "24/7 emergency service for burst pipes, leaks, and urgent plumbing issues. Fast response guaranteed.",
    created_at: new Date()
  },
  {
    id: 2,
    name: "Drain Cleaning & Unclogging",
    description: "Professional drain cleaning using advanced equipment. Say goodbye to slow drains and blockages.",
    created_at: new Date()
  },
  {
    id: 3,
    name: "Water Heater Installation & Repair",
    description: "Expert water heater services including installation, repair, and maintenance for all types and brands.",
    created_at: new Date()
  },
  {
    id: 4,
    name: "Pipe Installation & Replacement",
    description: "Complete pipe services from minor repairs to full system replacements using modern materials.",
    created_at: new Date()
  },
  {
    id: 5,
    name: "Bathroom & Kitchen Plumbing",
    description: "Specialized plumbing for bathroom and kitchen renovations, fixture installation, and upgrades.",
    created_at: new Date()
  },
  {
    id: 6,
    name: "Preventive Maintenance",
    description: "Regular maintenance services to prevent costly repairs and extend the life of your plumbing system.",
    created_at: new Date()
  }
];

const serviceIcons = ["🚨", "🌊", "🔥", "🔧", "🚿", "🛠️"];

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getServices.query();
      // Since the handler is a stub returning empty array, use default services
      setServices(result.length > 0 ? result : defaultServices);
    } catch (error) {
      console.error('Failed to load services:', error);
      // Fallback to default services on error
      setServices(defaultServices);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Loading Services...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            🏠 Our Professional Services
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We provide comprehensive plumbing solutions for residential and commercial properties. 
            All work is performed by licensed professionals with a satisfaction guarantee.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: Service, index: number) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="text-4xl mb-2">{serviceIcons[index % serviceIcons.length]}</div>
                <CardTitle className="text-xl text-blue-800">{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 mb-4">
            ✅ Licensed & Insured • ✅ Free Estimates • ✅ Same Day Service Available
          </p>
        </div>
      </div>
    </section>
  );
}
