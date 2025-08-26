import { Card, CardContent } from '@/components/ui/card';
import { StarIcon } from 'lucide-react';
import type { Testimonial } from '../../../server/src/schema';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

interface TestimonialsSectionProps {
  className?: string;
}

export function TestimonialsSection({ className = '' }: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await trpc.getTestimonials.query();
        setTestimonials(data);
      } catch (error) {
        console.error('Failed to load testimonials:', error);
      }
    };

    fetchTestimonials();
  }, []);

  // If no testimonials are loaded, show placeholders
  const displayTestimonials = testimonials.length > 0 
    ? testimonials 
    : [
        {
          id: 1,
          customer_name: "Sarah Johnson",
          quote: "PlumbPerfect fixed our burst pipe in under an hour. Professional, clean, and fairly priced!",
          rating: 5,
          created_at: new Date()
        },
        {
          id: 2,
          customer_name: "Michael Torres",
          quote: "Installed a new water heater for us. The team was punctual and explained everything clearly.",
          rating: 5,
          created_at: new Date()
        },
        {
          id: 3,
          customer_name: "Jennifer Lee",
          quote: "Used them for a bathroom remodel. Quality workmanship and attention to detail were impressive.",
          rating: 4,
          created_at: new Date()
        }
      ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Customer Testimonials</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear what our satisfied customers have to say about our services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border border-gray-200">
              <CardContent className="pt-6">
                <div className="mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <div className="ml-4">
                    <p className="font-bold text-gray-800">{testimonial.customer_name}</p>
                    <p className="text-sm text-gray-600">
                      {testimonial.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
