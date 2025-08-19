import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

// Test category data
const testCategory = {
  name: 'Work Notes',
  color: '#FF5733',
  user_id: 0 // Will be set after user creation
};

// Test input
const testInput: CreateNoteInput = {
  title: 'Test Note',
  content: 'This is a test note content',
  category_id: null,
  user_id: 0 // Will be set after user creation
};

describe('createNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a note without category', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const noteInput = {
      ...testInput,
      user_id: userId,
      category_id: null
    };

    const result = await createNote(noteInput);

    // Basic field validation
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.category_id).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with category', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const noteInput = {
      ...testInput,
      user_id: userId,
      category_id: categoryId
    };

    const result = await createNote(noteInput);

    // Basic field validation
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.category_id).toEqual(categoryId);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const noteInput = {
      ...testInput,
      user_id: userId,
      category_id: null
    };

    const result = await createNote(noteInput);

    // Query the database to verify note was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Test Note');
    expect(notes[0].content).toEqual('This is a test note content');
    expect(notes[0].category_id).toBeNull();
    expect(notes[0].user_id).toEqual(userId);
    expect(notes[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const noteInput = {
      ...testInput,
      user_id: 999 // Non-existent user ID
    };

    await expect(createNote(noteInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when category does not exist', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const noteInput = {
      ...testInput,
      user_id: userId,
      category_id: 999 // Non-existent category ID
    };

    await expect(createNote(noteInput)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when category belongs to different user', async () => {
    // Create first test user
    const userResult1 = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    // Create second test user
    const userResult2 = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashed_password_2'
      })
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create category for first user
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId1
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Try to create note for second user with first user's category
    const noteInput = {
      ...testInput,
      user_id: userId2,
      category_id: categoryId
    };

    await expect(createNote(noteInput)).rejects.toThrow(/category does not belong to user/i);
  });

  it('should handle empty content', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const noteInput = {
      ...testInput,
      user_id: userId,
      content: '', // Empty content
      category_id: null
    };

    const result = await createNote(noteInput);

    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
  });

  it('should handle long content', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const longContent = 'A'.repeat(5000); // Very long content
    const noteInput = {
      ...testInput,
      user_id: userId,
      content: longContent,
      category_id: null
    };

    const result = await createNote(noteInput);

    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual(longContent);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
  });
});
