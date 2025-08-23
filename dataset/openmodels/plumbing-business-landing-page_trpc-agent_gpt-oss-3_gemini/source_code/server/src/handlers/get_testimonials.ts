import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';

/**
 * Fetch all testimonials from the database.
 * Returns an array of {@link Testimonial} objects.
 */
export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const results = await db.select().from(testimonialsTable).execute();
    // No numeric columns need conversion; Drizzle returns numbers and Dates directly.
    return results;
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    throw error;
  }
};
