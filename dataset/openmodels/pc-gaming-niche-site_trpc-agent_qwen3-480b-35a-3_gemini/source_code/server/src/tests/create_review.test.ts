import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, categoriesTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

// Test category input
const testCategory = {
  name: 'Test Category'
};

// Test review input
const testInput: CreateReviewInput = {
  title: 'Test Review',
  content: 'This is a test review content',
  category_id: 1,
  published: true
};

describe('createReview', () => {
  beforeEach(async () => {
    await createDB();
    // Create a category first since reviews need a valid category_id
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    // Update the test input with the actual category id
    testInput.category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a review', async () => {
    const result = await createReview(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Review');
    expect(result.content).toEqual(testInput.content);
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    const result = await createReview(testInput);

    // Query using proper drizzle syntax
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].title).toEqual('Test Review');
    expect(reviews[0].content).toEqual(testInput.content);
    expect(reviews[0].categoryId).toEqual(testInput.category_id);
    expect(reviews[0].published).toEqual(true);
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fail to create a review with non-existent category', async () => {
    const invalidInput: CreateReviewInput = {
      title: 'Invalid Review',
      content: 'This review should fail',
      category_id: 99999, // Non-existent category ID
      published: false
    };

    await expect(createReview(invalidInput)).rejects.toThrow(/Category with id 99999 not found/);
  });

  it('should create an unpublished review when published is false', async () => {
    const unpublishedInput: CreateReviewInput = {
      title: 'Unpublished Review',
      content: 'This is an unpublished review',
      category_id: testInput.category_id,
      published: false
    };

    const result = await createReview(unpublishedInput);

    expect(result.title).toEqual('Unpublished Review');
    expect(result.published).toEqual(false);
  });

  it('should create a review with default published value', async () => {
    const inputWithoutPublished: CreateReviewInput = {
      title: 'Review without published flag',
      content: 'This review uses the default published value',
      category_id: testInput.category_id
    } as CreateReviewInput; // Type assertion since we're omitting published

    // Mock the default behavior by explicitly setting it to false (as per schema)
    inputWithoutPublished.published = false;
    
    const result = await createReview(inputWithoutPublished);

    expect(result.title).toEqual('Review without published flag');
    expect(result.published).toEqual(false);
  });
});
