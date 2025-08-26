import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { type NewTestimonial } from '../db/schema';
import { getTestimonials } from '../handlers/get_testimonials';

describe('getTestimonials handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no testimonials exist', async () => {
    const result = await getTestimonials();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all testimonials from the database', async () => {
    // Insert test testimonials
    const testData: NewTestimonial[] = [
      { customer_name: 'Alice', content: 'Excellent service!', rating: 5 },
      { customer_name: 'Bob', content: 'Good job', rating: 4 },
      { customer_name: 'Charlie', content: 'Average experience', rating: null },
    ];

    await db.insert(testimonialsTable).values(testData).execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(3);
    // Sort results for deterministic comparison
    const sorted = result.sort((a, b) => a.id - b.id);
    expect(sorted[0].customer_name).toBe('Alice');
    expect(sorted[0].content).toBe('Excellent service!');
    expect(sorted[0].rating).toBe(5);
    expect(sorted[1].customer_name).toBe('Bob');
    expect(sorted[1].rating).toBe(4);
    expect(sorted[2].customer_name).toBe('Charlie');
    expect(sorted[2].rating).toBeUndefined();
  });
});
