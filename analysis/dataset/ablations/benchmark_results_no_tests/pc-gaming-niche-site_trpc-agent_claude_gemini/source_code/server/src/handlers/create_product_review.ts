import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type CreateProductReviewInput, type ProductReview } from '../schema';

export const createProductReview = async (input: CreateProductReviewInput): Promise<ProductReview> => {
  try {
    // Insert product review record
    const result = await db.insert(productReviewsTable)
      .values({
        product_name: input.product_name,
        brand: input.brand,
        category: input.category,
        rating: input.rating, // real column - no conversion needed for insert
        pros: input.pros, // JSONB array
        cons: input.cons, // JSONB array
        review_text: input.review_text,
        image_urls: input.image_urls, // JSONB array (has default of [])
        is_published: input.is_published // boolean (has default of false)
      })
      .returning()
      .execute();

    // Return the created review - no numeric conversions needed as rating is real type
    const review = result[0];
    return {
      ...review,
      // Ensure arrays are properly typed for TypeScript
      pros: review.pros as string[],
      cons: review.cons as string[],
      image_urls: review.image_urls as string[]
    };
  } catch (error) {
    console.error('Product review creation failed:', error);
    throw error;
  }
};
