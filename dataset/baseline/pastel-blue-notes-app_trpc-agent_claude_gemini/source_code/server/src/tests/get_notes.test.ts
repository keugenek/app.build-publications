import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { getNotes } from '../handlers/get_notes';
import { eq } from 'drizzle-orm';

describe('getNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let categoryId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashed_password'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733',
        user_id: testUserId
      })
      .returning()
      .execute();

    categoryId = categories[0].id;
  });

  it('should return empty array when user has no notes', async () => {
    const result = await getNotes(testUserId);

    expect(result).toEqual([]);
  });

  it('should return all notes for a user', async () => {
    // Create first note
    await db.insert(notesTable)
      .values({
        title: 'First Note',
        content: 'First note content',
        category_id: categoryId,
        user_id: testUserId
      })
      .execute();

    // Wait to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second note
    await db.insert(notesTable)
      .values({
        title: 'Second Note',
        content: 'Second note content',
        category_id: null,
        user_id: testUserId
      })
      .execute();

    const result = await getNotes(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Note'); // Should be first due to DESC order (created second)
    expect(result[1].title).toEqual('First Note');
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[1].user_id).toEqual(testUserId);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter notes by category when categoryId is provided', async () => {
    // Create another category
    const otherCategories = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        color: '#33FF57',
        user_id: testUserId
      })
      .returning()
      .execute();

    const otherCategoryId = otherCategories[0].id;

    // Create notes in different categories
    await db.insert(notesTable)
      .values([
        {
          title: 'Note in Category 1',
          content: 'Content 1',
          category_id: categoryId,
          user_id: testUserId
        },
        {
          title: 'Note in Category 2',
          content: 'Content 2',
          category_id: otherCategoryId,
          user_id: testUserId
        },
        {
          title: 'Note without Category',
          content: 'Content 3',
          category_id: null,
          user_id: testUserId
        }
      ])
      .execute();

    const result = await getNotes(testUserId, categoryId);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Note in Category 1');
    expect(result[0].category_id).toEqual(categoryId);
  });

  it('should only return notes belonging to the specified user', async () => {
    // Create notes for both users
    await db.insert(notesTable)
      .values([
        {
          title: 'User 1 Note',
          content: 'User 1 content',
          category_id: categoryId,
          user_id: testUserId
        },
        {
          title: 'User 2 Note',
          content: 'User 2 content',
          category_id: null,
          user_id: otherUserId
        }
      ])
      .execute();

    const result = await getNotes(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Note');
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should order notes by updated_at DESC', async () => {
    // Create first note
    const firstNote = await db.insert(notesTable)
      .values({
        title: 'Older Note',
        content: 'Older content',
        category_id: null,
        user_id: testUserId
      })
      .returning()
      .execute();

    // Wait to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create second note (should be newer)
    const secondNote = await db.insert(notesTable)
      .values({
        title: 'Newer Note',
        content: 'Newer content',
        category_id: null,
        user_id: testUserId
      })
      .returning()
      .execute();

    const result = await getNotes(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Note'); // Should be first due to DESC order
    expect(result[1].title).toEqual('Older Note');
    expect(result[0].updated_at >= result[1].updated_at).toBe(true);
  });

  it('should handle notes with null category_id correctly', async () => {
    await db.insert(notesTable)
      .values({
        title: 'Note without Category',
        content: 'Content without category',
        category_id: null,
        user_id: testUserId
      })
      .execute();

    const result = await getNotes(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Note without Category');
    expect(result[0].category_id).toBeNull();
  });

  it('should return empty array when filtering by non-existent category', async () => {
    // Create a note with a category
    await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        category_id: categoryId,
        user_id: testUserId
      })
      .execute();

    // Filter by non-existent category
    const result = await getNotes(testUserId, 99999);

    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent user', async () => {
    // Create a note for test user
    await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Test content',
        category_id: categoryId,
        user_id: testUserId
      })
      .execute();

    // Query with non-existent user ID
    const result = await getNotes(99999);

    expect(result).toEqual([]);
  });
});
