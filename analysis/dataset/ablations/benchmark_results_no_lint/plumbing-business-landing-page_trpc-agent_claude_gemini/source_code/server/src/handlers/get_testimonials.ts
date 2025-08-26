import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { desc } from 'drizzle-orm';

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    // Fetch all testimonials ordered by creation date (newest first)
    const results = await db.select()
      .from(testimonialsTable)
      .orderBy(desc(testimonialsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    throw error;
  }
};
