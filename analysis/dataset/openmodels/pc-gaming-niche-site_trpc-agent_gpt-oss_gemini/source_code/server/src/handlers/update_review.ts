import { type UpdateReviewInput, type Review } from '../schema';

/**
 * Stub handler to update a review.
 * Real implementation should update the record in `reviews` table.
 */
import { db } from "../db";
import { reviewsTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const updateReview = async (input: UpdateReviewInput): Promise<Review> => {
  // Fetch existing review
  const existingArr = await db.select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, input.id))
    .execute();

  if (existingArr.length === 0) {
    throw new Error(`Review with id ${input.id} not found`);
  }
  const existing = existingArr[0];

  // Build update object, preserving unchanged fields
  const updateValues = {
    title: input.title ?? existing.title,
    brand: input.brand ?? existing.brand,
    model: input.model ?? existing.model,
    rating: input.rating ?? existing.rating,
    summary: input.summary ?? existing.summary,
    body: input.body ?? existing.body,
    category_id: input.category_id ?? existing.category_id,
  } as const;

  // Perform update and return the updated record
  const updatedArr = await db.update(reviewsTable)
    .set(updateValues)
    .where(eq(reviewsTable.id, input.id))
    .returning()
    .execute();

  const updated = updatedArr[0];
  // Ensure created_at is a Date instance (drizzle returns Date already)
  return {
    ...updated,
    created_at: new Date(updated.created_at),
  } as Review;
};

