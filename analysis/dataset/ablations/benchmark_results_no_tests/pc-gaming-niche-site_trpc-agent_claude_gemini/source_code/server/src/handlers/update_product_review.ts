import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type UpdateProductReviewInput, type ProductReview } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProductReview = async (input: UpdateProductReviewInput): Promise<ProductReview> => {
  try {
    // First, check if the review exists
    const existingReview = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, input.id))
      .execute();

    if (existingReview.length === 0) {
      throw new Error(`Product review with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are provided in the input
    if (input.product_name !== undefined) {
      updateData.product_name = input.product_name;
    }
    if (input.brand !== undefined) {
      updateData.brand = input.brand;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.rating !== undefined) {
      updateData.rating = input.rating; // real column - no conversion needed
    }
    if (input.pros !== undefined) {
      updateData.pros = input.pros;
    }
    if (input.cons !== undefined) {
      updateData.cons = input.cons;
    }
    if (input.review_text !== undefined) {
      updateData.review_text = input.review_text;
    }
    if (input.image_urls !== undefined) {
      updateData.image_urls = input.image_urls;
    }
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }

    // Update the review
    const result = await db.update(productReviewsTable)
      .set(updateData)
      .where(eq(productReviewsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated review (no numeric conversions needed - rating is real, not numeric)
    return result[0];
  } catch (error) {
    console.error('Product review update failed:', error);
    throw error;
  }
};
