import { type Testimonial } from '../schema';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getTestimonials = async (): Promise<Testimonial[]> => {
  // Fetch all testimonials from the database, ordered by creation date (newest first)
  return await db.select().from(testimonialsTable).orderBy(desc(testimonialsTable.created_at));
};