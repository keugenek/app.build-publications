import { type Testimonial } from '../schema';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';

/**
 * Placeholder handler to fetch all testimonials.
 * Real implementation should query the `testimonials` table via Drizzle.
 */
export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const results = await db.select()
      .from(testimonialsTable)
      .execute();
    // Convert DB nullable rating to optional undefined as per schema
    const formatted = results.map((row) => ({
      ...row,
      rating: row.rating ?? undefined,
    }));
    return formatted;
  } catch (error) {
    console.error('Fetching testimonials failed:', error);
    throw error;
  }
  ;
};
