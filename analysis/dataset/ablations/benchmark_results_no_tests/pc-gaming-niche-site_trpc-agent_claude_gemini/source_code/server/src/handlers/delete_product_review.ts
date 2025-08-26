import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type DeleteReviewInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProductReview = async (input: DeleteReviewInput): Promise<{ success: boolean; id: number }> => {
  try {
    // Delete the review record
    const result = await db.delete(productReviewsTable)
      .where(eq(productReviewsTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were deleted
    if (result.length === 0) {
      throw new Error(`Product review with ID ${input.id} not found`);
    }

    return {
      success: true,
      id: input.id
    };
  } catch (error) {
    console.error('Product review deletion failed:', error);
    throw error;
  }
};
