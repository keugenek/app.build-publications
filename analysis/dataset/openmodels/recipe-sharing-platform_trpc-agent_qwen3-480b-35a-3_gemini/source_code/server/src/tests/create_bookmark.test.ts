import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, recipesTable } from '../db/schema';
import { type CreateBookmarkInput } from '../schema';
import { createBookmark } from '../handlers/create_bookmark';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateBookmarkInput = {
  recipeId: 1,
  userId: 'user-123'
};

describe('createBookmark', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test recipe first since bookmark references it
    await db.insert(recipesTable).values({
      id: 1,
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: ['ingredient1', 'ingredient2'],
      instructions: 'Test instructions',
      imageUrl: null
    }).execute();
  });
  
  afterEach(resetDB);

  it('should create a bookmark', async () => {
    const result = await createBookmark(testInput);

    // Basic field validation
    expect(result.recipeId).toEqual(1);
    expect(result.userId).toEqual('user-123');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save bookmark to database', async () => {
    const result = await createBookmark(testInput);

    // Query using proper drizzle syntax
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, result.id))
      .execute();

    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].recipeId).toEqual(1);
    expect(bookmarks[0].userId).toEqual('user-123');
    expect(bookmarks[0].createdAt).toBeInstanceOf(Date);
  });

  it('should fail to create bookmark for non-existent recipe', async () => {
    const invalidInput: CreateBookmarkInput = {
      recipeId: 999, // Non-existent recipe ID
      userId: 'user-123'
    };

    await expect(createBookmark(invalidInput)).rejects.toThrow();
  });
});
