import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, usersTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_here'
};

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category'
};

describe('createCategory', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput, userId);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput, userId);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].user_id).toEqual(userId);
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fail to create a category for non-existent user', async () => {
    // Try to create a category with a non-existent user ID
    const invalidUserId = 99999;
    
    await expect(createCategory(testInput, invalidUserId))
      .rejects.toThrow(/foreign key constraint/i);
  });
});
