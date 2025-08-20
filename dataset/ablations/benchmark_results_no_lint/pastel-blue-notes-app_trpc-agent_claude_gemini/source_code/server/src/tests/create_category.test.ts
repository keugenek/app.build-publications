import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, usersTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test user for foreign key relationship
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

// Test input for category creation
const testInput: CreateCategoryInput = {
  name: 'Work Notes',
  user_id: 1 // Will be set dynamically after user creation
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = { ...testInput, user_id: userId };

    const result = await createCategory(input);

    // Basic field validation
    expect(result.name).toEqual('Work Notes');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = { ...testInput, user_id: userId };

    const result = await createCategory(input);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Work Notes');
    expect(categories[0].user_id).toEqual(userId);
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, user_id: 999 }; // Non-existent user

    await expect(createCategory(input)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should handle special characters in category name', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input = {
      name: 'Special & Characters! @#$%',
      user_id: userId
    };

    const result = await createCategory(input);

    expect(result.name).toEqual('Special & Characters! @#$%');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
  });

  it('should create multiple categories for same user', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first category
    const input1 = { name: 'Personal', user_id: userId };
    const result1 = await createCategory(input1);

    // Create second category
    const input2 = { name: 'Work', user_id: userId };
    const result2 = await createCategory(input2);

    // Verify both categories exist
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
      .execute();

    expect(categories).toHaveLength(2);
    expect(categories.map(c => c.name)).toEqual(expect.arrayContaining(['Personal', 'Work']));
    expect(result1.id).not.toEqual(result2.id);
  });
});
