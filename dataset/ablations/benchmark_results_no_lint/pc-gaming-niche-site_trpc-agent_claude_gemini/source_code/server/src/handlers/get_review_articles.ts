import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type ReviewQuery, type ReviewArticle } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export async function getReviewArticles(query: ReviewQuery): Promise<ReviewArticle[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    if (query.category !== undefined) {
      conditions.push(eq(reviewArticlesTable.category, query.category));
    }
    
    if (query.brand !== undefined) {
      conditions.push(eq(reviewArticlesTable.brand, query.brand));
    }
    
    if (query.price_range !== undefined) {
      conditions.push(eq(reviewArticlesTable.price_range, query.price_range));
    }
    
    if (query.published !== undefined) {
      conditions.push(eq(reviewArticlesTable.published, query.published));
    }
    
    // Execute query directly without intermediate variables
    let results;
    if (conditions.length === 0) {
      // No filters - simple query
      results = await db.select()
        .from(reviewArticlesTable)
        .orderBy(desc(reviewArticlesTable.created_at))
        .limit(query.limit)
        .offset(query.offset)
        .execute();
    } else {
      // With filters
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      results = await db.select()
        .from(reviewArticlesTable)
        .where(whereClause)
        .orderBy(desc(reviewArticlesTable.created_at))
        .limit(query.limit)
        .offset(query.offset)
        .execute();
    }
    
    // Cast JSON fields to proper types and return
    return results.map(result => ({
      ...result,
      pros: result.pros as string[],
      cons: result.cons as string[]
    }));
  } catch (error) {
    console.error('Failed to fetch review articles:', error);
    throw error;
  }
}
