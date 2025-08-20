import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput } from '../schema';
import { getTestimonials } from '../handlers/get_testimonials';

// Test testimonial data
const testTestimonial1: CreateTestimonialInput = {
  customer_name: 'John Smith',
  review_text: 'Excellent plumbing service! Fixed my sink quickly and professionally.',
  rating: 5
};

const testTestimonial2: CreateTestimonialInput = {
  customer_name: 'Sarah Johnson',
  review_text: 'Very reliable and affordable. Highly recommend for any plumbing needs.',
  rating: 4
};

const testTestimonial3: CreateTestimonialInput = {
  customer_name: 'Mike Davis',
  review_text: 'Great work on our bathroom renovation. Clean and efficient.',
  rating: 5
};

describe('getTestimonials', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no testimonials exist', async () => {
    const result = await getTestimonials();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all testimonials', async () => {
    // Create test testimonials
    await db.insert(testimonialsTable)
      .values([testTestimonial1, testTestimonial2, testTestimonial3])
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(3);
    
    // Verify all testimonials are returned
    const customerNames = result.map(t => t.customer_name);
    expect(customerNames).toContain('John Smith');
    expect(customerNames).toContain('Sarah Johnson');
    expect(customerNames).toContain('Mike Davis');
  });

  it('should return testimonials ordered by created_at desc (newest first)', async () => {
    // Insert testimonials with specific timing to test ordering
    const firstTestimonial = await db.insert(testimonialsTable)
      .values(testTestimonial1)
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTestimonial = await db.insert(testimonialsTable)
      .values(testTestimonial2)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTestimonial = await db.insert(testimonialsTable)
      .values(testTestimonial3)
      .returning()
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(3);
    
    // Should be ordered newest first (descending by created_at)
    expect(result[0].customer_name).toEqual('Mike Davis'); // Last inserted
    expect(result[1].customer_name).toEqual('Sarah Johnson'); // Second inserted
    expect(result[2].customer_name).toEqual('John Smith'); // First inserted

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return testimonials with correct structure and types', async () => {
    // Create a single test testimonial
    await db.insert(testimonialsTable)
      .values(testTestimonial1)
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(1);
    
    const testimonial = result[0];
    
    // Check all required fields exist and have correct types
    expect(testimonial.id).toBeDefined();
    expect(typeof testimonial.id).toBe('number');
    
    expect(testimonial.customer_name).toEqual('John Smith');
    expect(typeof testimonial.customer_name).toBe('string');
    
    expect(testimonial.review_text).toEqual('Excellent plumbing service! Fixed my sink quickly and professionally.');
    expect(typeof testimonial.review_text).toBe('string');
    
    expect(testimonial.rating).toEqual(5);
    expect(typeof testimonial.rating).toBe('number');
    
    expect(testimonial.created_at).toBeInstanceOf(Date);
  });

  it('should handle various rating values correctly', async () => {
    // Create testimonials with different ratings
    const testimonialRating1 = { ...testTestimonial1, rating: 1, customer_name: 'Rating 1' };
    const testimonialRating3 = { ...testTestimonial2, rating: 3, customer_name: 'Rating 3' };
    const testimonialRating5 = { ...testTestimonial3, rating: 5, customer_name: 'Rating 5' };

    await db.insert(testimonialsTable)
      .values([testimonialRating1, testimonialRating3, testimonialRating5])
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(3);
    
    // Verify all ratings are preserved correctly
    const ratings = result.map(t => t.rating).sort();
    expect(ratings).toEqual([1, 3, 5]);

    // Verify each rating is a number
    result.forEach(testimonial => {
      expect(typeof testimonial.rating).toBe('number');
      expect(testimonial.rating >= 1 && testimonial.rating <= 5).toBe(true);
    });
  });
});
