import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, productsTable, categoriesTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

// Test input
const testReviewInput: CreateReviewInput = {
  product_id: 1,
  title: 'Great Gaming Mouse',
  content: 'This mouse has excellent precision and comfort for long gaming sessions',
  rating: 5,
  pros: 'High precision sensor, comfortable grip',
  cons: 'Slightly expensive'
};

describe('createReview', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Gaming Peripherals',
        description: 'PC gaming accessories'
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create a product first (as reviews need a valid product_id)
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Gaming Mouse',
        description: 'High precision gaming mouse',
        price: '49.99',
        category_id: categoryId
      })
      .returning()
      .execute();
    
    // Update the test input with the actual product ID
    testReviewInput.product_id = productResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a review', async () => {
    const result = await createReview(testReviewInput);

    // Basic field validation
    expect(result.product_id).toEqual(testReviewInput.product_id);
    expect(result.title).toEqual(testReviewInput.title);
    expect(result.content).toEqual(testReviewInput.content);
    expect(result.rating).toEqual(testReviewInput.rating);
    expect(result.pros).toEqual(testReviewInput.pros);
    expect(result.cons).toEqual(testReviewInput.cons);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    const result = await createReview(testReviewInput);

    // Query using proper drizzle syntax
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].product_id).toEqual(testReviewInput.product_id);
    expect(reviews[0].title).toEqual(testReviewInput.title);
    expect(reviews[0].content).toEqual(testReviewInput.content);
    expect(reviews[0].rating).toEqual(testReviewInput.rating);
    expect(reviews[0].pros).toEqual(testReviewInput.pros);
    expect(reviews[0].cons).toEqual(testReviewInput.cons);
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a review with minimal fields', async () => {
    const minimalInput: CreateReviewInput = {
      product_id: testReviewInput.product_id,
      title: 'Basic Review',
      content: 'This is a basic review',
      rating: 3,
      pros: null,
      cons: null
    };

    const result = await createReview(minimalInput);

    expect(result.product_id).toEqual(minimalInput.product_id);
    expect(result.title).toEqual(minimalInput.title);
    expect(result.content).toEqual(minimalInput.content);
    expect(result.rating).toEqual(minimalInput.rating);
    expect(result.pros).toBeNull();
    expect(result.cons).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
