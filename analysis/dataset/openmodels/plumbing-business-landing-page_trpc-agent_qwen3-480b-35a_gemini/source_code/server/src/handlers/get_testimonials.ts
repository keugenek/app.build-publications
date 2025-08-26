import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    // Fetch all testimonials from the database
    const testimonials = await db.select()
      .from(testimonialsTable)
      .orderBy(testimonialsTable.created_at)
      .execute();

    // Map database schema to API schema
    return testimonials.map(testimonial => ({
      id: testimonial.id,
      customer_name: testimonial.name,
      quote: testimonial.quote,
      rating: testimonial.rating,
      created_at: testimonial.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    throw error;
  }
};
