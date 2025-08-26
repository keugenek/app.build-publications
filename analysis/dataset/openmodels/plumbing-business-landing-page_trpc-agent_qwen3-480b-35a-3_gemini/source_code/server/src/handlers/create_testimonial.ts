import { type CreateTestimonialInput, type Testimonial } from '../schema';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';

export const createTestimonial = async (input: CreateTestimonialInput): Promise<Testimonial> => {
  // Insert new testimonial into the database
  const [newTestimonial] = await db.insert(testimonialsTable).values(input).returning();
  return newTestimonial;
};