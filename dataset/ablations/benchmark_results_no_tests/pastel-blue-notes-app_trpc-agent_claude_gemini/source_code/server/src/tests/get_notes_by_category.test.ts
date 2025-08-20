import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type GetNotesByCategoryInput } from '../schema';
import { getNotesByCategory } from '../handlers/get_notes_by_category';

// Test data
let testUser: { id: number; username: string; email: string };
let testCategory: { id: number; name: string; user_id: number };
let testNotes: Array<{ id: number; title: string; content: string; user_id: number; category_id: number | null }>;

describe('getNotesByCategory', () => {
  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        user_id: testUser.id
      })
      .returning()
      .execute();
    testCategory = categoryResult[0];

    // Create test notes - some categorized, some uncategorized
    const noteResults = await db.insert(notesTable)
      .values([
        {
          title: 'Categorized Note 1',
          content: 'This is in the Work category',
          user_id: testUser.id,
          category_id: testCategory.id
        },
        {
          title: 'Categorized Note 2',
          content: 'This is also in the Work category',
          user_id: testUser.id,
          category_id: testCategory.id
        },
        {
          title: 'Uncategorized Note 1',
          content: 'This has no category',
          user_id: testUser.id,
          category_id: null
        },
        {
          title: 'Uncategorized Note 2',
          content: 'This also has no category',
          user_id: testUser.id,
          category_id: null
        }
      ])
      .returning()
      .execute();
    testNotes = noteResults;
  });

  afterEach(resetDB);

  it('should get notes for a specific category', async () => {
    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: testCategory.id
    };

    const result = await getNotesByCategory(input);

    expect(result).toHaveLength(2);
    expect(result.every(note => note.category_id === testCategory.id)).toBe(true);
    expect(result.every(note => note.user_id === testUser.id)).toBe(true);
    
    const titles = result.map(note => note.title).sort();
    expect(titles).toEqual(['Categorized Note 1', 'Categorized Note 2']);
  });

  it('should get uncategorized notes when category_id is null', async () => {
    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: null
    };

    const result = await getNotesByCategory(input);

    expect(result).toHaveLength(2);
    expect(result.every(note => note.category_id === null)).toBe(true);
    expect(result.every(note => note.user_id === testUser.id)).toBe(true);
    
    const titles = result.map(note => note.title).sort();
    expect(titles).toEqual(['Uncategorized Note 1', 'Uncategorized Note 2']);
  });

  it('should return empty array when category has no notes', async () => {
    // Create another category with no notes
    const emptyCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        user_id: testUser.id
      })
      .returning()
      .execute();

    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: emptyCategoryResult[0].id
    };

    const result = await getNotesByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when user has no uncategorized notes', async () => {
    // Create a new user with no uncategorized notes
    const newUserResult = await db.insert(usersTable)
      .values({
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const input: GetNotesByCategoryInput = {
      user_id: newUserResult[0].id,
      category_id: null
    };

    const result = await getNotesByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error when category does not belong to user', async () => {
    // Create another user
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const input: GetNotesByCategoryInput = {
      user_id: otherUserResult[0].id,
      category_id: testCategory.id // This category belongs to testUser, not otherUser
    };

    expect(async () => {
      await getNotesByCategory(input);
    }).toThrow(/category not found or does not belong to user/i);
  });

  it('should throw error when category does not exist', async () => {
    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: 99999 // Non-existent category
    };

    expect(async () => {
      await getNotesByCategory(input);
    }).toThrow(/category not found or does not belong to user/i);
  });

  it('should only return notes belonging to the specified user', async () => {
    // Create another user with their own notes
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create notes for the other user
    await db.insert(notesTable)
      .values([
        {
          title: 'Other User Note',
          content: 'This belongs to another user',
          user_id: otherUserResult[0].id,
          category_id: null
        }
      ])
      .execute();

    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: null
    };

    const result = await getNotesByCategory(input);

    // Should only return testUser's uncategorized notes, not otherUser's
    expect(result).toHaveLength(2);
    expect(result.every(note => note.user_id === testUser.id)).toBe(true);
    expect(result.every(note => note.title.includes('Uncategorized'))).toBe(true);
  });

  it('should return notes with correct structure', async () => {
    const input: GetNotesByCategoryInput = {
      user_id: testUser.id,
      category_id: testCategory.id
    };

    const result = await getNotesByCategory(input);

    expect(result).toHaveLength(2);
    
    const note = result[0];
    expect(note.id).toBeDefined();
    expect(typeof note.id).toBe('number');
    expect(typeof note.title).toBe('string');
    expect(typeof note.content).toBe('string');
    expect(note.user_id).toBe(testUser.id);
    expect(note.category_id).toBe(testCategory.id);
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
  });
});
