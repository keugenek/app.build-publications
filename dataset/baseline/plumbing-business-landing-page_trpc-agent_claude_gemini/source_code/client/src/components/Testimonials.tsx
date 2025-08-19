import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Quote } from 'lucide-react';
import type { Testimonial } from '../../../server/src/schema';

interface TestimonialsProps {
  testimonials: Testimonial[];
  isLoading: boolean;
}

// Fallback testimonials to demonstrate design (removed when backend is implemented)
const fallbackTestimonials: Omit<Testimonial, 'id' | 'created_at'>[] = [
  {
    customer_name: 'Sarah Johnson',
    customer_location: 'Downtown Area',
    rating: 5,
    review_text: 'Excellent service! They fixed our emergency pipe burst at 2 AM. Professional, quick, and reasonably priced. I\'ll definitely call them again for any plumbing needs.',
    service_type: 'Emergency Plumbing',
    is_featured: true
  },
  {
    customer_name: 'Mike Rodriguez',
    customer_location: 'Westside',
    rating: 5,
    review_text: 'Outstanding work on our bathroom renovation. The team was punctual, clean, and completed everything on schedule. Highly recommend for any major plumbing work.',
    service_type: 'Bathroom Plumbing',
    is_featured: true
  },
  {
    customer_name: 'Emily Chen',
    customer_location: 'North Hills',
    rating: 5,
    review_text: 'They installed our new water heater quickly and explained everything clearly. Fair pricing and excellent customer service. Very happy with the results!',
    service_type: 'Water Heater Installation',
    is_featured: true
  },
  {
    customer_name: 'David Thompson',
    customer_location: 'East Valley',
    rating: 5,
    review_text: 'Professional drain cleaning service. They cleared our persistent blockage that other companies couldn\'t fix. Great communication throughout the process.',
    service_type: 'Drain Cleaning',
    is_featured: false
  },
  {
    customer_name: 'Lisa Martinez',
    customer_location: 'Central District',
    rating: 5,
    review_text: 'Reliable and trustworthy plumbers. They\'ve helped us multiple times with various issues. Always professional and their work lasts. Family business you can trust.',
    service_type: 'General Plumbing',
    is_featured: true
  },
  {
    customer_name: 'Robert Kim',
    customer_location: 'Suburban Area',
    rating: 5,
    review_text: 'Impressed with their knowledge and efficiency. Fixed our complex toilet installation issue that others said couldn\'t be done. Excellent problem-solving skills.',
    service_type: 'Toilet Installation',
    is_featured: true
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex space-x-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials({ testimonials, isLoading }: TestimonialsProps) {
  // Use fallback testimonials if no testimonials from backend (stub implementation)
  const displayTestimonials = testimonials.length > 0 ? testimonials : fallbackTestimonials;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers 
            have to say about our plumbing services.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-64">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Skeleton key={starIndex} className="h-4 w-4 rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTestimonials.map((testimonial, index) => (
              <Card 
                key={testimonials.length > 0 ? (testimonial as Testimonial).id : index}
                className="hover:shadow-lg transition-shadow duration-300 relative"
              >
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-blue-200 mb-4" />
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <StarRating rating={testimonial.rating} />
                    {testimonial.service_type && (
                      <span className="text-sm text-gray-500">
                        • {testimonial.service_type}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "{testimonial.review_text}"
                  </p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.customer_name}
                      </p>
                      {testimonial.customer_location && (
                        <p className="text-sm text-gray-500">
                          {testimonial.customer_location}
                        </p>
                      )}
                    </div>
                    {testimonial.is_featured && (
                      <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                        ⭐ Featured
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12 bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join Our Satisfied Customers
          </h3>
          <p className="text-gray-600 mb-4">
            Experience the same professional service that earned us these great reviews.
          </p>
          <button 
            onClick={() => {
              const contactSection = document.getElementById('contact');
              contactSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Get Your Free Quote Today
          </button>
        </div>
      </div>
    </section>
  );
}
