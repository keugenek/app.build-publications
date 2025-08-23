import { db } from '../db';
import { eq } from 'drizzle-orm';
import { reviewsTable, productsTable } from '../db/schema';
import { type CreateReviewInput, type UpdateReviewInput, type Review } from '../schema';

/**
 * Create a new review for an existing product.
 * Validates the product foreign key before insertion.
 */
export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  // Verify that the referenced product exists to satisfy foreign key constraints
  const product = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, input.product_id))
    .execute();

  if (product.length === 0) {
    throw new Error('Product not found');
  }

  // Insert the review. `created_at` is set by the DB default.
  const result = await db
    .insert(reviewsTable)
    .values({
      product_id: input.product_id,
      title: input.title,
      content: input.content,
      rating: input.rating,
      pros: input.pros,
      cons: input.cons,
    })
    .returning()
    .execute();

  const review = result[0];
  // Ensure the date field is a proper Date instance
  return {
    ...review,
    created_at: new Date(review.created_at),
  } as Review;
};

/** Fetch all reviews */
export const getReviews = async (): Promise<Review[]> => {
  const rows = await db.select().from(reviewsTable).execute();
  return rows.map(r => ({
    ...r,
    created_at: new Date(r.created_at),
  })) as Review[];
};

/** Update an existing review */
export const updateReview = async (input: UpdateReviewInput): Promise<Review> => {
  // Retrieve existing review to keep unchanged fields
  const existingRows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, input.id))
    .execute();

  if (existingRows.length === 0) {
    throw new Error('Review not found');
  }

  const existing = existingRows[0];

  const result = await db
    .update(reviewsTable)
    .set({
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      rating: input.rating ?? existing.rating,
      pros: input.pros ?? existing.pros,
      cons: input.cons ?? existing.cons,
    })
    .where(eq(reviewsTable.id, input.id))
    .returning()
    .execute();

  const updated = result[0];
  return {
    ...updated,
    created_at: new Date(updated.created_at),
  } as Review;
};
