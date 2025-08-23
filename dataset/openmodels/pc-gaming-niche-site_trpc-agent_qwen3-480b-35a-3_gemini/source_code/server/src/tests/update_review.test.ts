import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { type UpdateReviewInput, type CreateCategoryInput, type CreateReviewInput } from '../schema';
import { updateReview } from '../handlers/update_review';
import { eq } from 'drizzle-orm';

// Test data
const testCategoryInput: CreateCategoryInput = {
  name: 'Test Category'
};

const testReviewInput: CreateReviewInput = {
  title: 'Test Review',
  content: 'This is a test review',
  category_id: 0, // Will be set after creating category
  published: false
};

describe('updateReview', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    
    // Set the category_id for the review
    testReviewInput.category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should update a review', async () => {
    // First create a review
    const createdReview = await db.insert(reviewsTable)
      .values({
        title: testReviewInput.title,
        content: testReviewInput.content,
        categoryId: testReviewInput.category_id,
        published: testReviewInput.published
      })
      .returning()
      .execute();
    
    const reviewId = createdReview[0].id;
    
    // Update the review
    const updateInput: UpdateReviewInput = {
      id: reviewId,
      title: 'Updated Review Title',
      content: 'Updated review content',
      published: true
    };
    
    const result = await updateReview(updateInput);

    // Basic field validation
    expect(result.id).toEqual(reviewId);
    expect(result.title).toEqual('Updated Review Title');
    expect(result.content).toEqual('Updated review content');
    expect(result.published).toEqual(true);
    expect(result.category_id).toEqual(testReviewInput.category_id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should save updated review to database', async () => {
    // First create a review
    const createdReview = await db.insert(reviewsTable)
      .values({
        title: testReviewInput.title,
        content: testReviewInput.content,
        categoryId: testReviewInput.category_id,
        published: testReviewInput.published
      })
      .returning()
      .execute();
    
    const reviewId = createdReview[0].id;
    
    // Update the review
    const updateInput: UpdateReviewInput = {
      id: reviewId,
      title: 'Database Updated Review',
      published: true
    };
    
    await updateReview(updateInput);

    // Query the updated review from database
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewId))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].title).toEqual('Database Updated Review');
    expect(reviews[0].published).toEqual(true);
    expect(reviews[0].content).toEqual(testReviewInput.content); // Should be unchanged
    expect(reviews[0].categoryId).toEqual(testReviewInput.category_id); // Should be unchanged
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at was actually updated
    expect(reviews[0].updated_at.getTime()).toBeGreaterThanOrEqual(reviews[0].created_at.getTime());
  });

  it('should throw error when updating non-existent review', async () => {
    const updateInput: UpdateReviewInput = {
      id: 99999, // Non-existent ID
      title: 'Should Fail'
    };

    await expect(updateReview(updateInput)).rejects.toThrow(/Review with id 99999 not found/i);
  });

  it('should partially update a review', async () => {
    // First create a review
    const createdReview = await db.insert(reviewsTable)
      .values({
        title: testReviewInput.title,
        content: testReviewInput.content,
        categoryId: testReviewInput.category_id,
        published: testReviewInput.published
      })
      .returning()
      .execute();
    
    const reviewId = createdReview[0].id;
    
    // Update only the title
    const updateInput: UpdateReviewInput = {
      id: reviewId,
      title: 'Partially Updated Title'
      // Other fields are not provided, so they should remain unchanged
    };
    
    const result = await updateReview(updateInput);

    expect(result.id).toEqual(reviewId);
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.content).toEqual(testReviewInput.content); // Should be unchanged
    expect(result.published).toEqual(testReviewInput.published); // Should be unchanged
    expect(result.category_id).toEqual(testReviewInput.category_id); // Should be unchanged
  });
});
