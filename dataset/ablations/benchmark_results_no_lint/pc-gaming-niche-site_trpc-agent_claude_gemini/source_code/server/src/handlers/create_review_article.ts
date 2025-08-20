import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type CreateReviewArticleInput, type ReviewArticle } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to generate URL-friendly slug from product name and brand
function generateSlug(productName: string, brand: string): string {
  const combined = `${brand} ${productName}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Helper function to ensure slug uniqueness
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  // Keep checking until we find a unique slug
  while (true) {
    const existing = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.slug, slug))
      .limit(1)
      .execute();
    
    if (existing.length === 0) {
      return slug;
    }
    
    // If slug exists, append counter and try again
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function createReviewArticle(input: CreateReviewArticleInput): Promise<ReviewArticle> {
  try {
    // Generate base slug and ensure uniqueness
    const baseSlug = generateSlug(input.product_name, input.brand);
    const uniqueSlug = await generateUniqueSlug(baseSlug);
    
    // Insert review article record
    const result = await db.insert(reviewArticlesTable)
      .values({
        product_name: input.product_name,
        brand: input.brand,
        category: input.category,
        star_rating: input.star_rating,
        price_range: input.price_range,
        pros: input.pros, // JSON field - stored as-is
        cons: input.cons, // JSON field - stored as-is
        review_body: input.review_body,
        slug: uniqueSlug,
        published: input.published
      })
      .returning()
      .execute();

    const reviewArticle = result[0];
    
    // Return the created review article with proper type conversion
    return {
      ...reviewArticle,
      pros: reviewArticle.pros as string[], // Ensure proper JSON type casting
      cons: reviewArticle.cons as string[]  // Ensure proper JSON type casting
    };
  } catch (error) {
    console.error('Review article creation failed:', error);
    throw error;
  }
}
