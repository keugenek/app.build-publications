import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create a test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const input: DeleteCategoryInput = {
      id: category.id
    };

    const result = await deleteCategory(input);

    expect(result.success).toBe(true);

    // Verify category was deleted from database
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(deletedCategory).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const input: DeleteCategoryInput = {
      id: 999 // Non-existent ID
    };

    expect(deleteCategory(input)).rejects.toThrow(/Category with ID 999 not found/i);
  });

  it('should prevent deletion when category has associated review articles', async () => {
    // Create a test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create a review article associated with this category
    await db.insert(reviewArticlesTable)
      .values({
        title: 'iPhone 15 Review',
        category_id: category.id,
        brand: 'Apple',
        model: 'iPhone 15',
        star_rating: '4.5',
        pros: 'Great camera, fast performance',
        cons: 'Expensive, limited customization',
        main_image_url: 'https://example.com/iphone15.jpg',
        review_content: 'This is a comprehensive review of the iPhone 15.',
        published_at: new Date()
      })
      .execute();

    const input: DeleteCategoryInput = {
      id: category.id
    };

    expect(deleteCategory(input)).rejects.toThrow(/Cannot delete category with ID .* because it has associated review articles/i);

    // Verify category still exists in database
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(existingCategory).toHaveLength(1);
    expect(existingCategory[0].name).toBe('Electronics');
  });

  it('should handle database constraints properly', async () => {
    // Create a test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Gaming',
        description: 'Gaming products'
      })
      .returning()
      .execute();

    // Create multiple review articles associated with this category
    await db.insert(reviewArticlesTable)
      .values([
        {
          title: 'PlayStation 5 Review',
          category_id: category.id,
          brand: 'Sony',
          model: 'PlayStation 5',
          star_rating: '4.8',
          pros: 'Amazing graphics, fast loading',
          cons: 'Hard to find, expensive',
          main_image_url: 'https://example.com/ps5.jpg',
          review_content: 'The PS5 delivers next-gen gaming.',
          published_at: new Date()
        },
        {
          title: 'Xbox Series X Review',
          category_id: category.id,
          brand: 'Microsoft',
          model: 'Xbox Series X',
          star_rating: '4.7',
          pros: 'Great value, backwards compatibility',
          cons: 'Limited exclusives',
          main_image_url: 'https://example.com/xbox.jpg',
          review_content: 'Xbox Series X offers excellent performance.',
          published_at: new Date()
        }
      ])
      .execute();

    const input: DeleteCategoryInput = {
      id: category.id
    };

    expect(deleteCategory(input)).rejects.toThrow(/Cannot delete category with ID .* because it has associated review articles/i);

    // Verify both category and review articles still exist
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    const associatedReviews = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.category_id, category.id))
      .execute();

    expect(existingCategory).toHaveLength(1);
    expect(associatedReviews).toHaveLength(2);
  });
});
