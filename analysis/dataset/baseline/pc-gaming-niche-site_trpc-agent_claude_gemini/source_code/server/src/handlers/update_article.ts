import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type UpdateArticleInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArticle = async (input: UpdateArticleInput): Promise<Article | null> => {
  try {
    const { id, ...updateData } = input;

    // Build update object with only provided fields
    const updateFields: Record<string, any> = {};
    
    if (updateData.product_name !== undefined) {
      updateFields['product_name'] = updateData.product_name;
    }
    
    if (updateData.category !== undefined) {
      updateFields['category'] = updateData.category;
    }
    
    if (updateData.price !== undefined) {
      updateFields['price'] = updateData.price.toString(); // Convert number to string for numeric column
    }
    
    if (updateData.overall_rating !== undefined) {
      updateFields['overall_rating'] = updateData.overall_rating.toString(); // Convert number to string for numeric column
    }
    
    if (updateData.short_description !== undefined) {
      updateFields['short_description'] = updateData.short_description;
    }
    
    if (updateData.detailed_review !== undefined) {
      updateFields['detailed_review'] = updateData.detailed_review;
    }
    
    if (updateData.pros !== undefined) {
      updateFields['pros'] = updateData.pros;
    }
    
    if (updateData.cons !== undefined) {
      updateFields['cons'] = updateData.cons;
    }
    
    if (updateData.main_image_url !== undefined) {
      updateFields['main_image_url'] = updateData.main_image_url;
    }

    // Always update the updated_at timestamp
    updateFields['updated_at'] = new Date();

    // If no fields to update, return null
    if (Object.keys(updateFields).length === 1) { // Only updated_at was added
      return null;
    }

    // Update the article
    const result = await db.update(articlesTable)
      .set(updateFields)
      .where(eq(articlesTable.id, id))
      .returning()
      .execute();

    // Return null if no article was found/updated
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const article = result[0];
    return {
      ...article,
      price: parseFloat(article.price), // Convert string back to number
      overall_rating: parseFloat(article.overall_rating) // Convert string back to number
    };
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
};
