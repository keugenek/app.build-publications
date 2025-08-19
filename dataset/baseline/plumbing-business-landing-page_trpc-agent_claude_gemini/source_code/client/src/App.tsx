import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import type { Service, Testimonial } from '../../server/src/schema';

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load featured services for homepage
      const servicesData = await trpc.getFeaturedServices.query();
      const testimonialsData = await trpc.getFeaturedTestimonials.query();
      
      setServices(servicesData);
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Services services={services} isLoading={isLoading} />
      <Testimonials testimonials={testimonials} isLoading={isLoading} />
      <ContactForm />
      <Footer />
    </div>
  );
}

export default App;
