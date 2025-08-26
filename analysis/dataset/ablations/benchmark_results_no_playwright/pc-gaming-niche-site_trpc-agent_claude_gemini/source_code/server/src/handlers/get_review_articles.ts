import { db } from '../db';
import { reviewArticlesTable, categoriesTable } from '../db/schema';
import { type GetReviewArticlesQuery, type ReviewArticleWithCategory } from '../schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export async function getReviewArticles(query: GetReviewArticlesQuery): Promise<ReviewArticleWithCategory[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    if (query.category_id !== undefined) {
      conditions.push(eq(reviewArticlesTable.category_id, query.category_id));
    }

    // Build the complete query
    const baseQuery = db.select({
      // Review article fields
      id: reviewArticlesTable.id,
      title: reviewArticlesTable.title,
      category_id: reviewArticlesTable.category_id,
      brand: reviewArticlesTable.brand,
      model: reviewArticlesTable.model,
      star_rating: reviewArticlesTable.star_rating,
      pros: reviewArticlesTable.pros,
      cons: reviewArticlesTable.cons,
      main_image_url: reviewArticlesTable.main_image_url,
      review_content: reviewArticlesTable.review_content,
      published_at: reviewArticlesTable.published_at,
      created_at: reviewArticlesTable.created_at,
      updated_at: reviewArticlesTable.updated_at,
      // Category information
      category: {
        name: categoriesTable.name,
        description: categoriesTable.description
      }
    })
    .from(reviewArticlesTable)
    .innerJoin(categoriesTable, eq(reviewArticlesTable.category_id, categoriesTable.id));

    // Apply conditions, ordering, and pagination
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    
    let finalQuery;
    if (conditions.length > 0) {
      finalQuery = baseQuery
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(reviewArticlesTable.published_at))
        .limit(limit)
        .offset(offset);
    } else {
      finalQuery = baseQuery
        .orderBy(desc(reviewArticlesTable.published_at))
        .limit(limit)
        .offset(offset);
    }

    const results = await finalQuery.execute();

    // Convert numeric fields and return properly typed results
    return results.map(result => ({
      ...result,
      star_rating: parseFloat(result.star_rating) // Convert numeric field from string to number
    }));
  } catch (error) {
    console.error('Failed to fetch review articles:', error);
    throw error;
  }
}
