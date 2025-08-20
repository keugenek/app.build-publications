import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq, and } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a category name', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        user_id: userId
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Test input
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category Name',
      user_id: userId
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update category in database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        user_id: userId
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Database Updated Category',
      user_id: userId
    };

    await updateCategory(updateInput);

    // Verify the category was updated in database
    const updatedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(updatedCategory).toHaveLength(1);
    expect(updatedCategory[0].name).toEqual('Database Updated Category');
    expect(updatedCategory[0].user_id).toEqual(userId);
    expect(updatedCategory[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        user_id: userId
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;
    const originalCreatedAt = categoryResult[0].created_at;

    // Update with only user_id (no name change)
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      user_id: userId
      // name is optional and not provided
    };

    const result = await updateCategory(updateInput);

    // Name should remain unchanged, but updated_at should change
    expect(result.name).toEqual('Original Category');
    expect(result.updated_at > originalCreatedAt).toBe(true);
  });

  it('should fail when category does not exist', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const updateInput: UpdateCategoryInput = {
      id: 99999, // Non-existent category
      name: 'Updated Name',
      user_id: userId
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should fail when user does not own the category', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'testuser1',
        email: 'test1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create category owned by user1
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'User1 Category',
        user_id: user1Id
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Try to update with user2 (should fail)
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Hacked Category',
      user_id: user2Id
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/category not found or access denied/i);

    // Verify original category remains unchanged
    const originalCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(originalCategory[0].name).toEqual('User1 Category');
    expect(originalCategory[0].user_id).toEqual(user1Id);
  });

  it('should update updated_at timestamp', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        user_id: userId
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;
    const originalUpdatedAt = categoryResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Timestamp Test Category',
      user_id: userId
    };

    const result = await updateCategory(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
    expect(result.created_at).toEqual(categoryResult[0].created_at); // created_at should not change
  });
});
