import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, categoriesTable } from '../db/schema';
import { getReviews, getReviewById, getPublishedReviews } from '../handlers/get_reviews';

describe('getReviews', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create test reviews
    await db.insert(reviewsTable)
      .values([
        {
          title: 'Review 1',
          content: 'Content 1',
          categoryId: categoryId,
          published: true
        },
        {
          title: 'Review 2',
          content: 'Content 2',
          categoryId: categoryId,
          published: false
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all reviews', async () => {
    const reviews = await getReviews();

    expect(reviews).toHaveLength(2);
    
    // Check first review
    expect(reviews[0]).toMatchObject({
      title: 'Review 1',
      content: 'Content 1',
      published: true
    });
    expect(reviews[0].id).toBeDefined();
    expect(reviews[0].category_id).toBeDefined();
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
    
    // Check second review
    expect(reviews[1]).toMatchObject({
      title: 'Review 2',
      content: 'Content 2',
      published: false
    });
    expect(reviews[1].id).toBeDefined();
    expect(reviews[1].category_id).toBeDefined();
    expect(reviews[1].created_at).toBeInstanceOf(Date);
    expect(reviews[1].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch a review by ID', async () => {
    // First get an ID from the database
    const reviews = await db.select().from(reviewsTable).execute();
    const firstReviewId = reviews[0].id;

    const review = await getReviewById(firstReviewId);
    
    expect(review).not.toBeNull();
    expect(review).toMatchObject({
      id: firstReviewId,
      title: 'Review 1',
      content: 'Content 1',
      published: true
    });
    expect(review?.category_id).toBeDefined();
    expect(review?.created_at).toBeInstanceOf(Date);
    expect(review?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent review ID', async () => {
    const review = await getReviewById(99999);
    expect(review).toBeNull();
  });

  it('should fetch only published reviews', async () => {
    const reviews = await getPublishedReviews();
    
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      title: 'Review 1',
      content: 'Content 1',
      published: true
    });
    expect(reviews[0].id).toBeDefined();
    expect(reviews[0].category_id).toBeDefined();
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
  });
});
