import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customCategoriesTable } from '../db/schema';
import { type CreateCustomCategoryInput } from '../schema';
import { createCustomCategory } from '../handlers/create_custom_category';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateCustomCategoryInput = {
  name: 'My Custom Category',
  userId: 'user-123'
};

describe('createCustomCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a custom category', async () => {
    const result = await createCustomCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('My Custom Category');
    expect(result.userId).toEqual('user-123');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save custom category to database', async () => {
    const result = await createCustomCategory(testInput);

    // Query using proper drizzle syntax
    const customCategories = await db.select()
      .from(customCategoriesTable)
      .where(eq(customCategoriesTable.id, result.id))
      .execute();

    expect(customCategories).toHaveLength(1);
    expect(customCategories[0].name).toEqual('My Custom Category');
    expect(customCategories[0].userId).toEqual('user-123');
    expect(customCategories[0].createdAt).toBeInstanceOf(Date);
  });

  it('should create multiple custom categories for the same user', async () => {
    const input1: CreateCustomCategoryInput = {
      name: 'Category 1',
      userId: 'user-456'
    };

    const input2: CreateCustomCategoryInput = {
      name: 'Category 2',
      userId: 'user-456'
    };

    const result1 = await createCustomCategory(input1);
    const result2 = await createCustomCategory(input2);

    // Verify both categories were created
    expect(result1.name).toEqual('Category 1');
    expect(result2.name).toEqual('Category 2');
    expect(result1.userId).toEqual('user-456');
    expect(result2.userId).toEqual('user-456');
    
    // Verify they have different IDs
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should create custom categories for different users', async () => {
    const input1: CreateCustomCategoryInput = {
      name: 'User 1 Category',
      userId: 'user-789'
    };

    const input2: CreateCustomCategoryInput = {
      name: 'User 2 Category',
      userId: 'user-987'
    };

    const result1 = await createCustomCategory(input1);
    const result2 = await createCustomCategory(input2);

    // Verify categories were created for different users
    expect(result1.name).toEqual('User 1 Category');
    expect(result2.name).toEqual('User 2 Category');
    expect(result1.userId).toEqual('user-789');
    expect(result2.userId).toEqual('user-987');
  });
});
