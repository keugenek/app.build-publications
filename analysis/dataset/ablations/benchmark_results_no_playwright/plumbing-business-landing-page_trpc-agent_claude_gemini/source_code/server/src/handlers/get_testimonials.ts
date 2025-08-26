import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { asc } from 'drizzle-orm';

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    // Fetch all testimonials ordered by display_order for consistent presentation
    const results = await db.select()
      .from(testimonialsTable)
      .orderBy(asc(testimonialsTable.display_order))
      .execute();

    // Return testimonials with proper type conversion
    return results;
  } catch (error) {
    console.error('Get testimonials failed:', error);
    throw error;
  }
};
