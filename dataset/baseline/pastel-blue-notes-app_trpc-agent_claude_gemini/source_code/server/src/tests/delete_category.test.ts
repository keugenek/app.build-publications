import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq, and } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733',
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Delete the category
    await deleteCategory(categoryId, userId);

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should set notes category_id to null when category is deleted', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733',
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create test note with category
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'This is a test note',
        category_id: categoryId,
        user_id: userId
      })
      .returning()
      .execute();
    
    const noteId = noteResult[0].id;

    // Delete the category
    await deleteCategory(categoryId, userId);

    // Verify note's category_id is set to null
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].category_id).toBeNull();
  });

  it('should throw error when trying to delete non-existent category', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Try to delete non-existent category
    await expect(deleteCategory(999, userId)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should throw error when trying to delete category owned by different user', async () => {
    // Create first user and their category
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user2Id = user2Result[0].id;

    // Create category for user1
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'User1 Category',
        color: '#FF5733',
        user_id: user1Id
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Try to delete user1's category as user2
    await expect(deleteCategory(categoryId, user2Id)).rejects.toThrow(/category not found or access denied/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should handle multiple notes associated with deleted category', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733',
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create multiple test notes with category
    await db.insert(notesTable)
      .values([
        {
          title: 'Test Note 1',
          content: 'First test note',
          category_id: categoryId,
          user_id: userId
        },
        {
          title: 'Test Note 2',
          content: 'Second test note',
          category_id: categoryId,
          user_id: userId
        },
        {
          title: 'Test Note 3',
          content: 'Third test note',
          category_id: categoryId,
          user_id: userId
        }
      ])
      .execute();

    // Delete the category
    await deleteCategory(categoryId, userId);

    // Verify all notes have category_id set to null
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    expect(notes).toHaveLength(3);
    notes.forEach(note => {
      expect(note.category_id).toBeNull();
    });
  });

  it('should not affect other users categories', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const user2Id = user2Result[0].id;

    // Create categories for both users with same name
    const user1CategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Shared Category Name',
        color: '#FF5733',
        user_id: user1Id
      })
      .returning()
      .execute();

    await db.insert(categoriesTable)
      .values({
        name: 'Shared Category Name',
        color: '#33FF57',
        user_id: user2Id
      })
      .returning()
      .execute();

    // Delete user1's category
    await deleteCategory(user1CategoryResult[0].id, user1Id);

    // Verify user1's category is deleted
    const user1Categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, user1Id))
      .execute();

    expect(user1Categories).toHaveLength(0);

    // Verify user2's category still exists
    const user2Categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, user2Id))
      .execute();

    expect(user2Categories).toHaveLength(1);
    expect(user2Categories[0].name).toEqual('Shared Category Name');
  });
});
