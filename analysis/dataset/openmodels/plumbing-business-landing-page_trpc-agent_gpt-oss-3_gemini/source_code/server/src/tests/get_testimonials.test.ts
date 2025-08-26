import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { getTestimonials } from '../handlers/get_testimonials';
import { eq } from 'drizzle-orm';

// Sample testimonial data
const sampleTestimonials: Omit<Testimonial, 'id' | 'created_at'>[] = [
  { name: 'Alice', message: 'Great service!', rating: 5 },
  { name: 'Bob', message: 'Very professional.', rating: 4 },
];

describe('getTestimonials', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all testimonials from the database', async () => {
    // Insert sample testimonials directly
    const inserted = await db
      .insert(testimonialsTable)
      .values(sampleTestimonials)
      .returning()
      .execute();

    // Ensure they were inserted
    expect(inserted).toHaveLength(sampleTestimonials.length);

    const result = await getTestimonials();

    // The handler should return the same number of records
    expect(result).toHaveLength(sampleTestimonials.length);

    // Verify each returned testimonial matches inserted data (ignoring id/created_at)
    const sortedResult = result.sort((a, b) => a.id - b.id);
    const sortedInserted = inserted.sort((a, b) => a.id - b.id);

    sortedResult.forEach((testimonial, idx) => {
      const expected = sortedInserted[idx];
      expect(testimonial.id).toBeDefined();
      expect(testimonial.created_at).toBeInstanceOf(Date);
      expect(testimonial.name).toBe(expected.name);
      expect(testimonial.message).toBe(expected.message);
      expect(testimonial.rating).toBe(expected.rating);
    });
  });

  it('should return an empty array when no testimonials exist', async () => {
    const result = await getTestimonials();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
