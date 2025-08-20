import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput } from '../schema';
import { createTestimonial } from '../handlers/create_testimonial';
import { eq, gte, between, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateTestimonialInput = {
  customer_name: 'John Smith',
  review_text: 'Excellent plumbing service! Fixed our leaky pipes quickly and professionally.',
  rating: 5
};

describe('createTestimonial', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a testimonial', async () => {
    const result = await createTestimonial(testInput);

    // Basic field validation
    expect(result.customer_name).toEqual('John Smith');
    expect(result.review_text).toEqual(testInput.review_text);
    expect(result.rating).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save testimonial to database', async () => {
    const result = await createTestimonial(testInput);

    // Query using proper drizzle syntax
    const testimonials = await db.select()
      .from(testimonialsTable)
      .where(eq(testimonialsTable.id, result.id))
      .execute();

    expect(testimonials).toHaveLength(1);
    expect(testimonials[0].customer_name).toEqual('John Smith');
    expect(testimonials[0].review_text).toEqual(testInput.review_text);
    expect(testimonials[0].rating).toEqual(5);
    expect(testimonials[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different rating values', async () => {
    const lowRatingInput: CreateTestimonialInput = {
      customer_name: 'Jane Doe',
      review_text: 'Service was okay, could be better.',
      rating: 2
    };

    const result = await createTestimonial(lowRatingInput);

    expect(result.customer_name).toEqual('Jane Doe');
    expect(result.rating).toEqual(2);
    expect(typeof result.rating).toEqual('number');
  });

  it('should create multiple testimonials independently', async () => {
    const input1: CreateTestimonialInput = {
      customer_name: 'Alice Johnson',
      review_text: 'Great service, highly recommend!',
      rating: 5
    };

    const input2: CreateTestimonialInput = {
      customer_name: 'Bob Wilson',
      review_text: 'Professional and timely work.',
      rating: 4
    };

    const result1 = await createTestimonial(input1);
    const result2 = await createTestimonial(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.customer_name).toEqual('Alice Johnson');
    expect(result2.customer_name).toEqual('Bob Wilson');
    expect(result1.rating).toEqual(5);
    expect(result2.rating).toEqual(4);
  });

  it('should query testimonials by date range correctly', async () => {
    // Create test testimonial
    await createTestimonial(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - step by step
    const testimonials = await db.select()
      .from(testimonialsTable)
      .where(
        and(
          gte(testimonialsTable.created_at, yesterday),
          between(testimonialsTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(testimonials.length).toBeGreaterThan(0);
    testimonials.forEach(testimonial => {
      expect(testimonial.created_at).toBeInstanceOf(Date);
      expect(testimonial.created_at >= yesterday).toBe(true);
      expect(testimonial.created_at <= tomorrow).toBe(true);
    });
  });

  it('should handle long review text', async () => {
    const longReviewInput: CreateTestimonialInput = {
      customer_name: 'Sarah Thompson',
      review_text: 'This plumbing company exceeded all my expectations. They arrived promptly, diagnosed the problem quickly, explained everything clearly, and completed the work with exceptional attention to detail. The pricing was fair and transparent. I would definitely use their services again and recommend them to friends and family.',
      rating: 5
    };

    const result = await createTestimonial(longReviewInput);

    expect(result.customer_name).toEqual('Sarah Thompson');
    expect(result.review_text).toEqual(longReviewInput.review_text);
    expect(result.rating).toEqual(5);
  });
});
