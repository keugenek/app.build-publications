import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wrench, 
  Droplets, 
  Zap, 
  ShowerHead, 
  Toilet, 
  Gauge,
  Settings,
  Home
} from 'lucide-react';
import type { Service } from '../../../server/src/schema';

interface ServicesProps {
  services: Service[];
  isLoading: boolean;
}

// Icon mapping for services
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  droplets: Droplets,
  zap: Zap,
  shower: ShowerHead,
  toilet: Toilet,
  pipe: Gauge,
  settings: Settings,
  home: Home,
};

// Fallback services to demonstrate design (removed when backend is implemented)
const fallbackServices: Omit<Service, 'id' | 'created_at'>[] = [
  {
    title: 'Emergency Plumbing',
    description: 'Available 24/7 for urgent plumbing emergencies including burst pipes, severe leaks, and blocked drains.',
    icon: 'wrench',
    price_range: '$150 - $500',
    is_featured: true,
    display_order: 1
  },
  {
    title: 'Drain Cleaning',
    description: 'Professional drain cleaning services using high-pressure water jetting and advanced equipment.',
    icon: 'droplets',
    price_range: '$100 - $300',
    is_featured: true,
    display_order: 2
  },
  {
    title: 'Water Heater Repair',
    description: 'Expert repair and installation of gas, electric, and tankless water heaters with warranty.',
    icon: 'zap',
    price_range: '$200 - $800',
    is_featured: true,
    display_order: 3
  },
  {
    title: 'Bathroom Plumbing',
    description: 'Complete bathroom renovation plumbing including fixture installation and pipe rerouting.',
    icon: 'shower',
    price_range: '$300 - $2000',
    is_featured: false,
    display_order: 4
  },
  {
    title: 'Toilet Repair & Installation',
    description: 'Professional toilet repair, replacement, and installation services with quality fixtures.',
    icon: 'toilet',
    price_range: '$150 - $600',
    is_featured: true,
    display_order: 5
  },
  {
    title: 'Pipe Installation',
    description: 'New pipe installation, repiping services, and pipe repair using modern materials and techniques.',
    icon: 'pipe',
    price_range: '$200 - $1500',
    is_featured: true,
    display_order: 6
  }
];

export function Services({ services, isLoading }: ServicesProps) {
  // Use fallback services if no services from backend (stub implementation)
  const displayServices = services.length > 0 ? services : fallbackServices;

  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Plumbing Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From routine maintenance to emergency repairs, our licensed plumbers provide 
            comprehensive services with guaranteed satisfaction and competitive pricing.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-64">
                <CardHeader>
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map((service, index) => {
              const IconComponent = iconMap[service.icon] || Wrench;
              return (
                <Card 
                  key={services.length > 0 ? (service as Service).id : index} 
                  className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-600"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <IconComponent className="h-8 w-8 text-blue-600 mb-2" />
                      {service.is_featured && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {service.title}
                    </CardTitle>
                    {service.price_range && (
                      <CardDescription className="text-blue-600 font-semibold">
                        {service.price_range}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Don't see what you need? We handle all types of plumbing work!
          </p>
          <button 
            onClick={() => {
              const contactSection = document.getElementById('contact');
              contactSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Contact us for a custom quote →
          </button>
        </div>
      </div>
    </section>
  );
}
