import { db } from '../db';
import { reviewArticlesTable, categoriesTable } from '../db/schema';
import { type GetReviewArticleByIdQuery, type ReviewArticleWithCategory } from '../schema';
import { eq } from 'drizzle-orm';

export async function getReviewArticleById(query: GetReviewArticleByIdQuery): Promise<ReviewArticleWithCategory | null> {
  try {
    // Query with join to include category information
    const results = await db.select()
      .from(reviewArticlesTable)
      .innerJoin(categoriesTable, eq(reviewArticlesTable.category_id, categoriesTable.id))
      .where(eq(reviewArticlesTable.id, query.id))
      .execute();

    // Return null if no article found
    if (results.length === 0) {
      return null;
    }

    // Extract data from joined result structure
    const result = results[0];
    const articleData = result.review_articles;
    const categoryData = result.categories;

    // Return properly formatted result with numeric conversion
    return {
      id: articleData.id,
      title: articleData.title,
      category_id: articleData.category_id,
      brand: articleData.brand,
      model: articleData.model,
      star_rating: parseFloat(articleData.star_rating), // Convert numeric to number
      pros: articleData.pros,
      cons: articleData.cons,
      main_image_url: articleData.main_image_url,
      review_content: articleData.review_content,
      published_at: articleData.published_at,
      created_at: articleData.created_at,
      updated_at: articleData.updated_at,
      category: {
        name: categoryData.name,
        description: categoryData.description
      }
    };
  } catch (error) {
    console.error('Failed to get review article by id:', error);
    throw error;
  }
}
