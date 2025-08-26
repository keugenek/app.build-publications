import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput, type Article } from '../schema';

export const createArticle = async (input: CreateArticleInput): Promise<Article> => {
  try {
    // Insert article record
    const result = await db.insert(articlesTable)
      .values({
        product_name: input.product_name,
        category: input.category,
        price: input.price.toString(), // Convert number to string for numeric column
        overall_rating: input.overall_rating.toString(), // Convert number to string for numeric column
        short_description: input.short_description,
        detailed_review: input.detailed_review,
        pros: input.pros, // JSON field - no conversion needed
        cons: input.cons, // JSON field - no conversion needed
        main_image_url: input.main_image_url
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const article = result[0];
    return {
      ...article,
      price: parseFloat(article.price), // Convert string back to number
      overall_rating: parseFloat(article.overall_rating) // Convert string back to number
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};
