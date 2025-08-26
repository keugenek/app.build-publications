import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, reviewsTable } from '../db/schema';
import { type CreateCategoryInput, type CreateProductInput, type CreateReviewInput } from '../schema';
import { getReviews } from '../handlers/get_reviews';

describe('getReviews', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first (required for product)
    const categoryInput: CreateCategoryInput = {
      name: 'Gaming Mice',
      description: 'Gaming mice for PC'
    };
    
    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create a product (required for review)
    const productInput: CreateProductInput = {
      name: 'Razer DeathAdder V3',
      description: 'High-performance gaming mouse',
      price: 69.99,
      category_id: categoryId
    };
    
    const productResult = await db.insert(productsTable)
      .values({
        ...productInput,
        price: productInput.price?.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;
    
    // Create some reviews
    const reviewInputs: CreateReviewInput[] = [
      {
        product_id: productId,
        title: 'Amazing mouse!',
        content: 'This is the best gaming mouse I have ever used.',
        rating: 5,
        pros: 'Great ergonomics and responsiveness',
        cons: 'A bit expensive'
      },
      {
        product_id: productId,
        title: 'Good but has issues',
        content: 'Solid mouse but has some software problems.',
        rating: 3,
        pros: 'Good build quality',
        cons: 'Software can be buggy'
      }
    ];
    
    // Insert reviews
    for (const input of reviewInputs) {
      await db.insert(reviewsTable)
        .values(input)
        .execute();
    }
  });

  afterEach(resetDB);

  it('should fetch all reviews', async () => {
    const reviews = await getReviews();

    expect(reviews).toHaveLength(2);
    
    // Check the first review
    const firstReview = reviews[0];
    expect(firstReview.title).toEqual('Amazing mouse!');
    expect(firstReview.content).toEqual('This is the best gaming mouse I have ever used.');
    expect(firstReview.rating).toEqual(5);
    expect(firstReview.pros).toEqual('Great ergonomics and responsiveness');
    expect(firstReview.cons).toEqual('A bit expensive');
    expect(firstReview.product_id).toBeDefined();
    expect(firstReview.created_at).toBeInstanceOf(Date);
    expect(firstReview.updated_at).toBeInstanceOf(Date);
    
    // Check the second review
    const secondReview = reviews[1];
    expect(secondReview.title).toEqual('Good but has issues');
    expect(secondReview.content).toEqual('Solid mouse but has some software problems.');
    expect(secondReview.rating).toEqual(3);
    expect(secondReview.pros).toEqual('Good build quality');
    expect(secondReview.cons).toEqual('Software can be buggy');
  });

  it('should return an empty array when no reviews exist', async () => {
    // Clear all reviews
    await db.delete(reviewsTable).execute();
    
    const reviews = await getReviews();
    
    expect(reviews).toHaveLength(0);
    expect(reviews).toEqual([]);
  });
});
