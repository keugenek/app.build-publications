import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Zap, Droplets, Thermometer, Clock, Shield } from 'lucide-react';
import type { Service } from '../../../server/src/schema';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

interface ServicesSectionProps {
  className?: string;
}

export function ServicesSection({ className = '' }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await trpc.getServices.query();
        setServices(data);
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    };

    fetchServices();
  }, []);

  // If no services are loaded, show placeholders
  const displayServices = services.length > 0 
    ? services 
    : [
        {
          id: 1,
          title: "Emergency Plumbing",
          description: "24/7 emergency services for urgent plumbing issues. We respond within the hour to minimize damage to your property.",
          icon: null,
          created_at: new Date()
        },
        {
          id: 2,
          title: "Leak Detection & Repair",
          description: "Advanced leak detection technology to find hidden leaks quickly and efficiently, followed by expert repair services.",
          icon: null,
          created_at: new Date()
        },
        {
          id: 3,
          title: "Drain Cleaning",
          description: "Professional drain cleaning services to remove clogs and buildup, restoring proper flow to your plumbing system.",
          icon: null,
          created_at: new Date()
        },
        {
          id: 4,
          title: "Water Heater Services",
          description: "Installation, repair, and maintenance of all types of water heaters including tankless, electric, and gas models.",
          icon: null,
          created_at: new Date()
        },
        {
          id: 5,
          title: "Pipe Installation & Repair",
          description: "Expert installation and repair of all types of piping including copper, PVC, PEX, and galvanized systems.",
          icon: null,
          created_at: new Date()
        },
        {
          id: 6,
          title: "Bathroom & Kitchen Remodeling",
          description: "Complete plumbing solutions for bathroom and kitchen renovations, including fixture installation and code compliance.",
          icon: null,
          created_at: new Date()
        }
      ];

  const getIconForService = (index: number) => {
    const icons = [Clock, Droplets, Zap, Thermometer, Wrench, Shield];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-10 w-10 text-blue-700" />;
  };

  return (
    <section id="services" className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">Our Services</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Plumbing Solutions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Expert plumbing services for residential and commercial properties. Licensed, insured, and guaranteed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service, index) => (
            <Card key={service.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4">
                  {service.icon ? (
                    <img src={service.icon} alt={service.title} className="h-10 w-10" />
                  ) : (
                    getIconForService(index)
                  )}
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-700 mr-2" />
              <span className="text-lg font-bold">24/7 Emergency Service</span>
            </div>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <p className="text-gray-700">Call now for immediate assistance: <span className="font-bold">(555) 123-4567</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}
