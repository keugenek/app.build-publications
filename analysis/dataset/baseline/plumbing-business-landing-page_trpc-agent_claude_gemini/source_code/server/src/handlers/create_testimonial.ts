import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput, type Testimonial } from '../schema';

export const createTestimonial = async (input: CreateTestimonialInput): Promise<Testimonial> => {
  try {
    // Insert testimonial record
    const result = await db.insert(testimonialsTable)
      .values({
        customer_name: input.customer_name,
        customer_location: input.customer_location,
        rating: input.rating,
        review_text: input.review_text,
        service_type: input.service_type,
        is_featured: input.is_featured
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Testimonial creation failed:', error);
    throw error;
  }
};
