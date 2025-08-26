import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable, reviewsTable } from '../db/schema';
import { type CreateProductInput, type CreateCategoryInput, type CreateReviewInput } from '../schema';
import { getReviewsByProduct } from '../handlers/get_reviews_by_product';
import { eq } from 'drizzle-orm';

// Test data
const testCategoryInput: CreateCategoryInput = {
  name: 'Gaming Mice',
  description: 'Gaming mice for PC'
};

const testProductInput: CreateProductInput = {
  name: 'Razer DeathAdder V3',
  description: 'High-performance gaming mouse',
  price: 69.99,
  category_id: 1
};

const testReview1Input: CreateReviewInput = {
  product_id: 1,
  title: 'Amazing mouse!',
  content: 'This mouse has excellent precision and comfort.',
  rating: 5,
  pros: 'Great accuracy',
  cons: 'Slightly heavy'
};

const testReview2Input: CreateReviewInput = {
  product_id: 1,
  title: 'Good but overpriced',
  content: 'Nice mouse but not worth the price.',
  rating: 3,
  pros: 'Comfortable grip',
  cons: 'Too expensive'
};

describe('getReviewsByProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        ...testProductInput,
        category_id: categoryResult[0].id,
        price: testProductInput.price?.toString() // Convert to string for numeric column
      })
      .returning()
      .execute();
    
    // Create reviews
    await db.insert(reviewsTable)
      .values({
        ...testReview1Input,
        product_id: productResult[0].id
      })
      .returning()
      .execute();
    
    await db.insert(reviewsTable)
      .values({
        ...testReview2Input,
        product_id: productResult[0].id
      })
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all reviews for a product', async () => {
    const reviews = await getReviewsByProduct(1);
    
    expect(reviews).toHaveLength(2);
    
    // Check first review
    expect(reviews[0].product_id).toEqual(1);
    expect(reviews[0].title).toEqual('Amazing mouse!');
    expect(reviews[0].content).toEqual('This mouse has excellent precision and comfort.');
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].pros).toEqual('Great accuracy');
    expect(reviews[0].cons).toEqual('Slightly heavy');
    expect(reviews[0].id).toBeDefined();
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
    
    // Check second review
    expect(reviews[1].product_id).toEqual(1);
    expect(reviews[1].title).toEqual('Good but overpriced');
    expect(reviews[1].content).toEqual('Nice mouse but not worth the price.');
    expect(reviews[1].rating).toEqual(3);
    expect(reviews[1].pros).toEqual('Comfortable grip');
    expect(reviews[1].cons).toEqual('Too expensive');
    expect(reviews[1].id).toBeDefined();
    expect(reviews[1].created_at).toBeInstanceOf(Date);
    expect(reviews[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for product with no reviews', async () => {
    // Create another product without reviews
    const categoryResult = await db.select().from(categoriesTable).execute();
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Logitech G502',
        description: 'Another gaming mouse',
        price: '49.99', // Convert to string for numeric column
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();
    
    const reviews = await getReviewsByProduct(productResult[0].id);
    expect(reviews).toHaveLength(0);
  });

  it('should return empty array for non-existent product', async () => {
    const reviews = await getReviewsByProduct(99999);
    expect(reviews).toHaveLength(0);
  });
});
