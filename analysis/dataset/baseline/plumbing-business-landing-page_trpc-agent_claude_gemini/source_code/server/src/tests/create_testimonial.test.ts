import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type CreateTestimonialInput } from '../schema';
import { createTestimonial } from '../handlers/create_testimonial';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateTestimonialInput = {
  customer_name: 'Jane Smith',
  customer_location: 'Downtown Seattle',
  rating: 5,
  review_text: 'Excellent service! Fast and professional response to my emergency repair needs.',
  service_type: 'Emergency Repair',
  is_featured: true
};

// Test input with minimal required fields (nullables omitted)
const minimalInput: CreateTestimonialInput = {
  customer_name: 'John Doe',
  customer_location: null,
  rating: 4,
  review_text: 'Good service, would recommend to others for plumbing needs.',
  service_type: null,
  is_featured: false // Zod default
};

describe('createTestimonial', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a testimonial with all fields', async () => {
    const result = await createTestimonial(testInput);

    // Basic field validation
    expect(result.customer_name).toEqual('Jane Smith');
    expect(result.customer_location).toEqual('Downtown Seattle');
    expect(result.rating).toEqual(5);
    expect(result.review_text).toEqual('Excellent service! Fast and professional response to my emergency repair needs.');
    expect(result.service_type).toEqual('Emergency Repair');
    expect(result.is_featured).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a testimonial with minimal fields', async () => {
    const result = await createTestimonial(minimalInput);

    // Basic field validation
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_location).toBeNull();
    expect(result.rating).toEqual(4);
    expect(result.review_text).toEqual('Good service, would recommend to others for plumbing needs.');
    expect(result.service_type).toBeNull();
    expect(result.is_featured).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
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
    const savedTestimonial = testimonials[0];
    expect(savedTestimonial.customer_name).toEqual('Jane Smith');
    expect(savedTestimonial.customer_location).toEqual('Downtown Seattle');
    expect(savedTestimonial.rating).toEqual(5);
    expect(savedTestimonial.review_text).toEqual(testInput.review_text);
    expect(savedTestimonial.service_type).toEqual('Emergency Repair');
    expect(savedTestimonial.is_featured).toEqual(true);
    expect(savedTestimonial.created_at).toBeInstanceOf(Date);
  });

  it('should handle testimonials with different ratings', async () => {
    const ratings = [1, 2, 3, 4, 5];
    const createdTestimonials = [];

    // Create testimonials with different ratings
    for (const rating of ratings) {
      const input: CreateTestimonialInput = {
        customer_name: `Customer ${rating}`,
        customer_location: `Location ${rating}`,
        rating: rating,
        review_text: `This is a ${rating} star review with sufficient length.`,
        service_type: `Service Type ${rating}`,
        is_featured: rating === 5
      };
      
      const result = await createTestimonial(input);
      createdTestimonials.push(result);
    }

    // Verify all testimonials were created with correct ratings
    expect(createdTestimonials).toHaveLength(5);
    createdTestimonials.forEach((testimonial, index) => {
      expect(testimonial.rating).toEqual(ratings[index]);
      expect(testimonial.customer_name).toEqual(`Customer ${ratings[index]}`);
      expect(testimonial.is_featured).toEqual(ratings[index] === 5);
    });
  });

  it('should handle featured and non-featured testimonials', async () => {
    const featuredInput: CreateTestimonialInput = {
      ...testInput,
      is_featured: true
    };

    const nonFeaturedInput: CreateTestimonialInput = {
      ...minimalInput,
      is_featured: false
    };

    const featuredResult = await createTestimonial(featuredInput);
    const nonFeaturedResult = await createTestimonial(nonFeaturedInput);

    expect(featuredResult.is_featured).toEqual(true);
    expect(nonFeaturedResult.is_featured).toEqual(false);

    // Verify in database
    const allTestimonials = await db.select()
      .from(testimonialsTable)
      .execute();

    expect(allTestimonials).toHaveLength(2);
    const featured = allTestimonials.find(t => t.id === featuredResult.id);
    const nonFeatured = allTestimonials.find(t => t.id === nonFeaturedResult.id);

    expect(featured?.is_featured).toEqual(true);
    expect(nonFeatured?.is_featured).toEqual(false);
  });

  it('should preserve timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTestimonial(testInput);
    const afterCreation = new Date();

    // Verify timestamp is within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);

    // Verify timestamp is saved correctly in database
    const savedTestimonials = await db.select()
      .from(testimonialsTable)
      .where(eq(testimonialsTable.id, result.id))
      .execute();

    expect(savedTestimonials[0].created_at).toBeInstanceOf(Date);
    expect(savedTestimonials[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});
