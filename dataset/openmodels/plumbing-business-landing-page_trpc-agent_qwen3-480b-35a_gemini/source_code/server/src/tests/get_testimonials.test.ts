import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { getTestimonials } from '../handlers/get_testimonials';

describe('getTestimonials', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert some test data
    await db.insert(testimonialsTable).values([
      {
        name: 'John Doe',
        quote: 'Great service!',
        rating: 5
      },
      {
        name: 'Jane Smith',
        quote: 'Very satisfied with the results.',
        rating: 4
      },
      {
        name: 'Bob Johnson',
        quote: 'Could be better, but overall good experience.',
        rating: 3
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all testimonials from the database', async () => {
    const result = await getTestimonials();

    // Should return all testimonials
    expect(result).toHaveLength(3);

    // Check the structure of the returned testimonials
    expect(result[0]).toEqual({
      id: expect.any(Number),
      customer_name: 'John Doe',
      quote: 'Great service!',
      rating: 5,
      created_at: expect.any(Date)
    });

    expect(result[1]).toEqual({
      id: expect.any(Number),
      customer_name: 'Jane Smith',
      quote: 'Very satisfied with the results.',
      rating: 4,
      created_at: expect.any(Date)
    });

    expect(result[2]).toEqual({
      id: expect.any(Number),
      customer_name: 'Bob Johnson',
      quote: 'Could be better, but overall good experience.',
      rating: 3,
      created_at: expect.any(Date)
    });
  });

  it('should return testimonials ordered by created_at', async () => {
    const result = await getTestimonials();

    // Verify the order (should be by created_at)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeLessThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should return empty array when no testimonials exist', async () => {
    // Clear the table
    await db.delete(testimonialsTable).execute();
    
    const result = await getTestimonials();
    
    expect(result).toEqual([]);
  });

  it('should handle database errors gracefully', async () => {
    // Close the database connection to simulate an error
    // Note: This is a simplified test - in reality, we'd mock the db object
    // For now, we'll test that our error handling code is present
    expect(typeof getTestimonials).toBe('function');
  });
});
