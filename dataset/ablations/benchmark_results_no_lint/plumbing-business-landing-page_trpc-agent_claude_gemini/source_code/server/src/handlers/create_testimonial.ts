import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput, type Testimonial } from '../schema';

export const createTestimonial = async (input: CreateTestimonialInput): Promise<Testimonial> => {
  try {
    // Insert testimonial record
    const result = await db.insert(testimonialsTable)
      .values({
        customer_name: input.customer_name,
        review_text: input.review_text,
        rating: input.rating
      })
      .returning()
      .execute();

    // Return the created testimonial
    const testimonial = result[0];
    return testimonial;
  } catch (error) {
    console.error('Testimonial creation failed:', error);
    throw error;
  }
};
