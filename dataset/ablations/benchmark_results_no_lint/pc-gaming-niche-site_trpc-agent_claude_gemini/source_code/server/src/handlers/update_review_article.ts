import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type UpdateReviewArticleInput, type ReviewArticle } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to generate a URL-friendly slug
function generateSlug(productName: string, brand: string): string {
  return `${productName}-${brand}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

export async function updateReviewArticle(input: UpdateReviewArticleInput): Promise<ReviewArticle> {
  try {
    // First, get the current record to check if it exists and get current values
    const currentRecord = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, input.id))
      .execute();

    if (currentRecord.length === 0) {
      throw new Error(`Review article with id ${input.id} not found`);
    }

    const current = currentRecord[0];
    
    // Prepare update values, preserving existing values for fields not being updated
    const updateValues: any = {
      updated_at: new Date()
    };

    // Only update fields that are provided in the input
    if (input.product_name !== undefined) {
      updateValues.product_name = input.product_name;
    }
    if (input.brand !== undefined) {
      updateValues.brand = input.brand;
    }
    if (input.category !== undefined) {
      updateValues.category = input.category;
    }
    if (input.star_rating !== undefined) {
      updateValues.star_rating = input.star_rating;
    }
    if (input.price_range !== undefined) {
      updateValues.price_range = input.price_range;
    }
    if (input.pros !== undefined) {
      updateValues.pros = input.pros;
    }
    if (input.cons !== undefined) {
      updateValues.cons = input.cons;
    }
    if (input.review_body !== undefined) {
      updateValues.review_body = input.review_body;
    }
    if (input.published !== undefined) {
      updateValues.published = input.published;
    }

    // Regenerate slug if product_name or brand changed
    const productNameChanged = input.product_name !== undefined && input.product_name !== current.product_name;
    const brandChanged = input.brand !== undefined && input.brand !== current.brand;
    
    if (productNameChanged || brandChanged) {
      const newProductName = input.product_name || current.product_name;
      const newBrand = input.brand || current.brand;
      updateValues.slug = generateSlug(newProductName, newBrand);
    }

    // Update the record
    const result = await db.update(reviewArticlesTable)
      .set(updateValues)
      .where(eq(reviewArticlesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update review article with id ${input.id}`);
    }

    const updatedRecord = result[0];

    // Convert JSON fields and return the updated record
    return {
      ...updatedRecord,
      pros: updatedRecord.pros as string[],
      cons: updatedRecord.cons as string[]
    };
  } catch (error) {
    console.error('Review article update failed:', error);
    throw error;
  }
}
