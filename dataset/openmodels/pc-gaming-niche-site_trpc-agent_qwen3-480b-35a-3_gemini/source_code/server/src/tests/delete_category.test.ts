import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // First create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Delete the category
    const result = await deleteCategory(categoryId);
    
    expect(result).toBe(true);
    
    // Verify category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();
    
    expect(categories).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent category', async () => {
    const result = await deleteCategory(99999); // Non-existent ID
    expect(result).toBe(false);
  });

  it('should fail to delete a category with associated reviews due to foreign key constraint', async () => {
    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Category with Reviews' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create a review associated with this category
    await db.insert(reviewsTable)
      .values({
        title: 'Test Review',
        content: 'Test Content',
        categoryId: categoryId,
        published: true
      })
      .execute();
    
    // Attempt to delete the category - this should fail due to foreign key constraint
    await expect(deleteCategory(categoryId)).rejects.toThrow(/foreign key constraint/i);
    
    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();
    
    expect(categories).toHaveLength(1);
  });
});
