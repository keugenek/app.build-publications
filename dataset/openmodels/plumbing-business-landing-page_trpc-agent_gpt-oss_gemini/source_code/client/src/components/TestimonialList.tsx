import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Testimonial } from '../../../server/src/schema';

export function TestimonialList() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trpc.getTestimonials.query();
      setTestimonials(data);
    } catch (e) {
      setError('Failed to load testimonials');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  if (loading) {
    return <p className="text-gray-500">Loading testimonials...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t) => (
        <Card key={t.id} className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">{t.customer_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="italic mb-2">\"{t.content}\"</p>
            {typeof t.rating === 'number' && (
              <p className="text-yellow-500">{'⭐'.repeat(t.rating)}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
