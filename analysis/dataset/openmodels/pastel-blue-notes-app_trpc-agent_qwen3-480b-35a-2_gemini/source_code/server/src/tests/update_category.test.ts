import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testUser = {
    email: 'test@example.com',
    password_hash: 'hashed_password'
  };

  const testCategory = {
    name: 'Test Category'
  };

  it('should update a category owned by the user', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a category for that user
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Update the category
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category Name'
    };

    const result = await updateCategory(updateInput, userId);

    // Validate the result
    expect(result.id).toBe(categoryId);
    expect(result.name).toBe('Updated Category Name');
    expect(result.user_id).toBe(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    // Updated at should be more recent than created at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should save updated category to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a category for that user
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Update the category
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Database Updated Category'
    };

    await updateCategory(updateInput, userId);

    // Query the database to verify the update was saved
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Database Updated Category');
    expect(categories[0].user_id).toBe(userId);
  });

  it('should throw an error when trying to update a category that does not exist', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: 99999, // Non-existent category ID
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput, userId))
      .rejects
      .toThrow(/Category not found or does not belong to user/);
  });

  it('should throw an error when trying to update a category owned by another user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({ email: 'user1@example.com', password_hash: 'hash1' })
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values({ email: 'user2@example.com', password_hash: 'hash2' })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a category for user 1
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'User 1 Category',
        user_id: user1Id
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Try to update it as user 2
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Hacked Category Name'
    };

    await expect(updateCategory(updateInput, user2Id))
      .rejects
      .toThrow(/Category not found or does not belong to user/);

    // Verify the category was not actually updated
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories[0].name).toBe('User 1 Category');
  });
});
