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
    // Create a test user for category creation
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a category with all fields', async () => {
    const testInput: CreateCategoryInput = {
      name: 'Work Notes',
      color: '#ff5733',
      user_id: testUserId
    };

    const result = await createCategory(testInput);

    // Verify returned category structure
    expect(result.name).toEqual('Work Notes');
    expect(result.color).toEqual('#ff5733');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category without color (nullable field)', async () => {
    const testInput: CreateCategoryInput = {
      name: 'Personal Notes',
      user_id: testUserId
    };

    const result = await createCategory(testInput);

    // Verify category created with null color
    expect(result.name).toEqual('Personal Notes');
    expect(result.color).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database correctly', async () => {
    const testInput: CreateCategoryInput = {
      name: 'Study Notes',
      color: '#28a745',
      user_id: testUserId
    };

    const result = await createCategory(testInput);

    // Query database to verify category was saved
    const savedCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(savedCategories).toHaveLength(1);
    const savedCategory = savedCategories[0];
    expect(savedCategory.name).toEqual('Study Notes');
    expect(savedCategory.color).toEqual('#28a745');
    expect(savedCategory.user_id).toEqual(testUserId);
    expect(savedCategory.created_at).toBeInstanceOf(Date);
    expect(savedCategory.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories for the same user', async () => {
    const input1: CreateCategoryInput = {
      name: 'Category 1',
      color: '#red',
      user_id: testUserId
    };

    const input2: CreateCategoryInput = {
      name: 'Category 2',
      user_id: testUserId
    };

    const result1 = await createCategory(input1);
    const result2 = await createCategory(input2);

    // Verify both categories created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Category 1');
    expect(result1.color).toEqual('#red');
    expect(result2.name).toEqual('Category 2');
    expect(result2.color).toBeNull();

    // Verify both belong to same user
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentUserId = 99999;
    const testInput: CreateCategoryInput = {
      name: 'Invalid Category',
      color: '#blue',
      user_id: nonExistentUserId
    };

    await expect(createCategory(testInput)).rejects.toThrow(/User with ID 99999 does not exist/i);
  });

  it('should handle category with minimal required fields', async () => {
    const testInput: CreateCategoryInput = {
      name: 'Minimal Category',
      user_id: testUserId
    };

    const result = await createCategory(testInput);

    expect(result.name).toEqual('Minimal Category');
    expect(result.color).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeGreaterThan(0);
  });

  it('should preserve exact color value provided', async () => {
    const testInput: CreateCategoryInput = {
      name: 'Colored Category',
      color: '#FFFFFF',
      user_id: testUserId
    };

    const result = await createCategory(testInput);

    expect(result.color).toEqual('#FFFFFF');

    // Verify in database as well
    const dbResult = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(dbResult[0].color).toEqual('#FFFFFF');
  });
});
