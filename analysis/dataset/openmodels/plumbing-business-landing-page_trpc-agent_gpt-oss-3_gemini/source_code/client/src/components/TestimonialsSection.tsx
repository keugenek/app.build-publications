import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';
import type { Testimonial } from '../../../server/src/schema';

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpc.getTestimonials.query();
      setTestimonials(data);
    } catch (e) {
      console.error('Failed to load testimonials', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  return (
    <section className="py-16 px-4 bg-white" id="testimonials">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        {loading ? (
          <p className="text-center">Loading testimonials...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <Avatar className="w-12 h-12 mr-3" />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-gray-500">Rating: {t.rating}/5</p>
                  </div>
                </div>
                <p className="text-gray-700 flex-grow">"{t.message}"</p>
                <p className="text-xs text-gray-400 mt-4 text-right">
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
