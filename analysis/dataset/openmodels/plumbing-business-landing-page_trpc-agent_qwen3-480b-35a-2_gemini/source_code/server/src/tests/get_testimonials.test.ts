import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { getTestimonials } from '../handlers/get_testimonials';

describe('getTestimonials', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(testimonialsTable).values([
      {
        customer_name: 'John Doe',
        customer_location: 'New York',
        quote: 'Great service!',
        rating: 5
      },
      {
        customer_name: 'Jane Smith',
        customer_location: 'Los Angeles',
        quote: 'Very professional team',
        rating: 4
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all testimonials from the database', async () => {
    const testimonials = await getTestimonials();
    
    expect(testimonials).toHaveLength(2);
    
    // Check first testimonial
    expect(testimonials[0]).toEqual({
      id: 1,
      customer_name: 'John Doe',
      customer_location: 'New York',
      quote: 'Great service!',
      rating: 5,
      created_at: expect.any(Date)
    });
    
    // Check second testimonial
    expect(testimonials[1]).toEqual({
      id: 2,
      customer_name: 'Jane Smith',
      customer_location: 'Los Angeles',
      quote: 'Very professional team',
      rating: 4,
      created_at: expect.any(Date)
    });
  });

  it('should return an empty array when no testimonials exist', async () => {
    // Clear the testimonials table
    await db.delete(testimonialsTable).execute();
    
    const testimonials = await getTestimonials();
    
    expect(testimonials).toHaveLength(0);
  });

  it('should return testimonials ordered by creation date', async () => {
    // Add a third testimonial
    await db.insert(testimonialsTable).values({
      customer_name: 'Bob Johnson',
      customer_location: 'Chicago',
      quote: 'Will use again!',
      rating: 5
    }).execute();
    
    const testimonials = await getTestimonials();
    
    expect(testimonials).toHaveLength(3);
    // Should be ordered by created_at (oldest first)
    expect(testimonials[0].customer_name).toBe('John Doe');
    expect(testimonials[1].customer_name).toBe('Jane Smith');
    expect(testimonials[2].customer_name).toBe('Bob Johnson');
  });
});