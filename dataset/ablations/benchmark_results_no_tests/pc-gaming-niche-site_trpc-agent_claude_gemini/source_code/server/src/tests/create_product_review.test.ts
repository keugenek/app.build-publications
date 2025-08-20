import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type CreateProductReviewInput } from '../schema';
import { createProductReview } from '../handlers/create_product_review';
import { eq } from 'drizzle-orm';

// Test input with all required fields and some optional ones
const testInput: CreateProductReviewInput = {
  product_name: 'Logitech MX Master 3S',
  brand: 'Logitech',
  category: 'mice',
  rating: 8.5,
  pros: ['Great ergonomics', 'Excellent battery life', 'Smooth scrolling'],
  cons: ['Price is high', 'Heavy for some users'],
  review_text: 'This is an excellent mouse with premium features and build quality. The ergonomics are top-notch.',
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  is_published: true
};

// Minimal test input with only required fields (tests defaults)
const minimalInput: CreateProductReviewInput = {
  product_name: 'Basic Gaming Mouse',
  brand: 'Generic',
  category: 'mice',
  rating: 6,
  pros: ['Affordable'],
  cons: ['Basic build quality'],
  review_text: 'A basic mouse that gets the job done for casual users.',
  image_urls: [], // Explicit default
  is_published: false // Explicit default
};

describe('createProductReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product review with all fields', async () => {
    const result = await createProductReview(testInput);

    // Basic field validation
    expect(result.product_name).toEqual('Logitech MX Master 3S');
    expect(result.brand).toEqual('Logitech');
    expect(result.category).toEqual('mice');
    expect(result.rating).toEqual(8.5);
    expect(result.pros).toEqual(['Great ergonomics', 'Excellent battery life', 'Smooth scrolling']);
    expect(result.cons).toEqual(['Price is high', 'Heavy for some users']);
    expect(result.review_text).toEqual(testInput.review_text);
    expect(result.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.is_published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should create a review with defaults for optional fields', async () => {
    const result = await createProductReview(minimalInput);

    // Check that defaults are applied
    expect(result.product_name).toEqual('Basic Gaming Mouse');
    expect(result.brand).toEqual('Generic');
    expect(result.category).toEqual('mice');
    expect(result.rating).toEqual(6);
    expect(result.pros).toEqual(['Affordable']);
    expect(result.cons).toEqual(['Basic build quality']);
    expect(result.review_text).toEqual(minimalInput.review_text);
    expect(result.image_urls).toEqual([]); // Default empty array
    expect(result.is_published).toEqual(false); // Default false
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should save product review to database', async () => {
    const result = await createProductReview(testInput);

    // Query the database to verify the record was saved
    const reviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    const savedReview = reviews[0];
    expect(savedReview.product_name).toEqual('Logitech MX Master 3S');
    expect(savedReview.brand).toEqual('Logitech');
    expect(savedReview.category).toEqual('mice');
    expect(savedReview.rating).toEqual(8.5);
    expect(savedReview.pros).toEqual(['Great ergonomics', 'Excellent battery life', 'Smooth scrolling']);
    expect(savedReview.cons).toEqual(['Price is high', 'Heavy for some users']);
    expect(savedReview.review_text).toEqual(testInput.review_text);
    expect(savedReview.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(savedReview.is_published).toEqual(true);
    expect(savedReview.created_at).toBeInstanceOf(Date);
    expect(savedReview.updated_at).toBeNull();
  });

  it('should handle different product categories', async () => {
    const keyboardInput: CreateProductReviewInput = {
      product_name: 'Mechanical Keyboard Pro',
      brand: 'KeyboardCorp',
      category: 'keyboards',
      rating: 9,
      pros: ['Tactile switches', 'RGB lighting'],
      cons: ['Loud typing'],
      review_text: 'Excellent mechanical keyboard with great build quality and responsive keys.',
      image_urls: [],
      is_published: false
    };

    const result = await createProductReview(keyboardInput);

    expect(result.category).toEqual('keyboards');
    expect(result.product_name).toEqual('Mechanical Keyboard Pro');
    expect(result.brand).toEqual('KeyboardCorp');
    expect(result.rating).toEqual(9);
  });

  it('should handle edge case ratings', async () => {
    // Test minimum rating
    const minRatingInput: CreateProductReviewInput = {
      ...minimalInput,
      rating: 1
    };

    const minResult = await createProductReview(minRatingInput);
    expect(minResult.rating).toEqual(1);

    // Test maximum rating
    const maxRatingInput: CreateProductReviewInput = {
      ...minimalInput,
      product_name: 'Perfect Mouse',
      rating: 10
    };

    const maxResult = await createProductReview(maxRatingInput);
    expect(maxResult.rating).toEqual(10);
  });

  it('should handle empty arrays correctly', async () => {
    const emptyArraysInput: CreateProductReviewInput = {
      product_name: 'Simple Mouse',
      brand: 'SimpleBrand',
      category: 'mice',
      rating: 5,
      pros: [],
      cons: [],
      review_text: 'A straightforward mouse with no particular strengths or weaknesses.',
      image_urls: [],
      is_published: false
    };

    const result = await createProductReview(emptyArraysInput);

    expect(result.pros).toEqual([]);
    expect(result.cons).toEqual([]);
    expect(result.image_urls).toEqual([]);
  });

  it('should create multiple reviews independently', async () => {
    // Create first review
    const firstReview = await createProductReview(testInput);

    // Create second review with different data
    const secondInput: CreateProductReviewInput = {
      product_name: 'Gaming Headset Pro',
      brand: 'AudioTech',
      category: 'headsets',
      rating: 7.5,
      pros: ['Good sound quality', 'Comfortable padding'],
      cons: ['Microphone quality could be better'],
      review_text: 'Decent gaming headset with good audio but microphone needs improvement.',
      image_urls: [],
      is_published: false
    };

    const secondReview = await createProductReview(secondInput);

    // Verify both reviews exist and are different
    expect(firstReview.id).not.toEqual(secondReview.id);
    expect(firstReview.product_name).toEqual('Logitech MX Master 3S');
    expect(secondReview.product_name).toEqual('Gaming Headset Pro');
    expect(firstReview.category).toEqual('mice');
    expect(secondReview.category).toEqual('headsets');

    // Verify both are in database
    const allReviews = await db.select()
      .from(productReviewsTable)
      .execute();

    expect(allReviews).toHaveLength(2);
  });
});
