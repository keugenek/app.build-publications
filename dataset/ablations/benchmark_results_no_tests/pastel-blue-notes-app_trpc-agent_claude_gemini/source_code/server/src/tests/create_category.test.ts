import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, usersTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for category operations
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: CreateCategoryInput = {
    name: 'Work Notes',
    user_id: 0 // Will be set to testUserId in tests
  };

  it('should create a category successfully', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createCategory(input);

    // Basic field validation
    expect(result.name).toEqual('Work Notes');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createCategory(input);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Work Notes');
    expect(categories[0].user_id).toEqual(testUserId);
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories for the same user', async () => {
    const input1 = { ...testInput, name: 'Personal', user_id: testUserId };
    const input2 = { ...testInput, name: 'Projects', user_id: testUserId };

    const result1 = await createCategory(input1);
    const result2 = await createCategory(input2);

    expect(result1.name).toEqual('Personal');
    expect(result2.name).toEqual('Projects');
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both categories exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, testUserId))
      .execute();

    expect(allCategories).toHaveLength(2);
    const categoryNames = allCategories.map(cat => cat.name).sort();
    expect(categoryNames).toEqual(['Personal', 'Projects']);
  });

  it('should handle empty category names', async () => {
    const input = { ...testInput, name: '', user_id: testUserId };

    const result = await createCategory(input);

    expect(result.name).toEqual('');
    expect(result.user_id).toEqual(testUserId);

    // Verify it was saved to database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('');
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 99999;
    const input = { ...testInput, user_id: nonExistentUserId };

    await expect(createCategory(input)).rejects.toThrow(/User with ID 99999 does not exist/i);
  });

  it('should handle special characters in category names', async () => {
    const specialName = 'Notes & Ideas (2024) - #important!';
    const input = { ...testInput, name: specialName, user_id: testUserId };

    const result = await createCategory(input);

    expect(result.name).toEqual(specialName);
    expect(result.user_id).toEqual(testUserId);

    // Verify it was saved correctly to database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual(specialName);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const input = { ...testInput, user_id: testUserId };
    
    const result = await createCategory(input);
    
    const afterCreation = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
