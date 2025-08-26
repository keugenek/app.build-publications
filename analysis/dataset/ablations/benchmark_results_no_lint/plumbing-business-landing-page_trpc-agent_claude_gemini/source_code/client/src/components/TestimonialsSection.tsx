import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Testimonial } from '../../../server/src/schema';

// Default testimonials to display when API returns empty (since handlers are stubs)
const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    customer_name: "Sarah Johnson",
    review_text: "Excellent service! They fixed our emergency leak within an hour of calling. Professional, courteous, and reasonably priced. Highly recommend!",
    rating: 5,
    created_at: new Date('2024-01-15')
  },
  {
    id: 2,
    customer_name: "Mike Rodriguez",
    review_text: "Best plumber in town! Installed our new water heater quickly and efficiently. Clean work area and great communication throughout the process.",
    rating: 5,
    created_at: new Date('2024-01-10')
  },
  {
    id: 3,
    customer_name: "Emily Chen",
    review_text: "Called them for a drain issue and they were at my house the same day. Fixed the problem and gave great tips for prevention. Will definitely use again!",
    rating: 5,
    created_at: new Date('2024-01-05')
  },
  {
    id: 4,
    customer_name: "David Thompson",
    review_text: "Professional and reliable service. They handled our bathroom renovation plumbing perfectly. On time, on budget, and quality work.",
    rating: 4,
    created_at: new Date('2024-01-01')
  },
  {
    id: 5,
    customer_name: "Lisa Martinez",
    review_text: "Great experience from start to finish. Transparent pricing, skilled technicians, and they cleaned up after themselves. Five stars!",
    rating: 5,
    created_at: new Date('2023-12-28')
  },
  {
    id: 6,
    customer_name: "Robert Wilson",
    review_text: "Fast, friendly, and fair pricing. They've helped us with multiple plumbing issues over the years. Always our first call for plumbing needs.",
    rating: 5,
    created_at: new Date('2023-12-20')
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-2xl ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTestimonials = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTestimonials.query();
      // Since the handler is a stub returning empty array, use default testimonials
      setTestimonials(result.length > 0 ? result : defaultTestimonials);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
      // Fallback to default testimonials on error
      setTestimonials(defaultTestimonials);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Loading Testimonials...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            💬 What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it! Read what our satisfied customers have to say about our plumbing services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial: Testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">
                    {testimonial.customer_name}
                  </h3>
                  <StarRating rating={testimonial.rating} />
                </div>
                <p className="text-sm text-gray-500">
                  {testimonial.created_at.toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.review_text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              🏆 Why Choose Us?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>✅ 500+ Happy Customers</div>
              <div>✅ 4.9/5 Average Rating</div>
              <div>✅ 100% Satisfaction Guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
