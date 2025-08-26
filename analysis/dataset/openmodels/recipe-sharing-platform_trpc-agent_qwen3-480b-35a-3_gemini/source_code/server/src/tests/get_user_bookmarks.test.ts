import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookmarksTable, recipesTable } from '../db/schema';
import { getUserBookmarks } from '../handlers/get_user_bookmarks';
import { eq } from 'drizzle-orm';

describe('getUserBookmarks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test recipe first (required for foreign key constraint)
    const recipeResult = await db.insert(recipesTable)
      .values({
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: 'Test instructions',
        imageUrl: null
      })
      .returning()
      .execute();
    
    const recipeId = recipeResult[0].id;
    
    // Create test bookmarks for different users
    await db.insert(bookmarksTable)
      .values([
        {
          recipeId: recipeId,
          userId: 'user1',
          createdAt: new Date()
        },
        {
          recipeId: recipeId,
          userId: 'user1',
          createdAt: new Date()
        },
        {
          recipeId: recipeId,
          userId: 'user2',
          createdAt: new Date()
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should return bookmarks for a specific user', async () => {
    const userId = 'user1';
    const result = await getUserBookmarks(userId);

    // Check that we get the correct number of bookmarks
    expect(result).toHaveLength(2);
    
    // Check that all bookmarks belong to the specified user
    result.forEach(bookmark => {
      expect(bookmark.userId).toBe(userId);
      expect(bookmark.id).toBeDefined();
      expect(bookmark.recipeId).toBeDefined();
      expect(bookmark.createdAt).toBeInstanceOf(Date);
    });
  });

  it('should return an empty array for a user with no bookmarks', async () => {
    const userId = 'user-with-no-bookmarks';
    const result = await getUserBookmarks(userId);
    
    expect(result).toHaveLength(0);
  });

  it('should return bookmarks with correct data structure', async () => {
    const userId = 'user1';
    const result = await getUserBookmarks(userId);
    
    // Check the structure of the first bookmark
    const bookmark = result[0];
    expect(bookmark).toHaveProperty('id');
    expect(bookmark).toHaveProperty('recipeId');
    expect(bookmark).toHaveProperty('userId');
    expect(bookmark).toHaveProperty('createdAt');
    
    // Check data types
    expect(typeof bookmark.id).toBe('number');
    expect(typeof bookmark.recipeId).toBe('number');
    expect(typeof bookmark.userId).toBe('string');
    expect(bookmark.createdAt).toBeInstanceOf(Date);
  });

  it('should save bookmarks to database and retrieve them correctly', async () => {
    const userId = 'user1';
    
    // Get bookmarks through handler
    const handlerResults = await getUserBookmarks(userId);
    
    // Get bookmarks directly from database
    const dbResults = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, userId))
      .execute();
    
    // Both results should have same length
    expect(handlerResults).toHaveLength(dbResults.length);
    
    // Check that all database results are returned by handler
    dbResults.forEach(dbBookmark => {
      const found = handlerResults.some(handlerBookmark => 
        handlerBookmark.id === dbBookmark.id &&
        handlerBookmark.recipeId === dbBookmark.recipeId &&
        handlerBookmark.userId === dbBookmark.userId
      );
      expect(found).toBe(true);
    });
  });
});
