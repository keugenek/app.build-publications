import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

// Test category data
const testCategory = {
  name: 'Test Category'
};

// Test note input
const testNoteInput: CreateNoteInput = {
  title: 'Test Note',
  content: 'This is a test note content',
  user_id: 1, // Will be set dynamically in tests
  category_id: undefined
};

describe('createNote', () => {
  let userId: number;
  let categoryId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;
  });

  afterEach(resetDB);

  it('should create a note without category', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: userId
    };

    const result = await createNote(input);

    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.user_id).toEqual(userId);
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with category', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: userId,
      category_id: categoryId
    };

    const result = await createNote(input);

    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.user_id).toEqual(userId);
    expect(result.category_id).toEqual(categoryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: userId,
      category_id: categoryId
    };

    const result = await createNote(input);

    // Query the database to verify the note was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Test Note');
    expect(notes[0].content).toEqual('This is a test note content');
    expect(notes[0].user_id).toEqual(userId);
    expect(notes[0].category_id).toEqual(categoryId);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: 999999 // Non-existent user ID
    };

    await expect(createNote(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when category does not exist', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: userId,
      category_id: 999999 // Non-existent category ID
    };

    await expect(createNote(input)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when category belongs to different user', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        username: 'anotheruser',
        email: 'another@example.com',
        password_hash: 'another_hash'
      })
      .returning()
      .execute();
    const anotherUserId = anotherUserResult[0].id;

    // Try to create note with categoryId that belongs to different user
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: anotherUserId,
      category_id: categoryId // This category belongs to userId, not anotherUserId
    };

    await expect(createNote(input)).rejects.toThrow(/category not found or does not belong to user/i);
  });

  it('should allow null category_id', async () => {
    const input: CreateNoteInput = {
      ...testNoteInput,
      user_id: userId,
      category_id: null
    };

    const result = await createNote(input);

    expect(result.category_id).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.title).toEqual('Test Note');
  });

  it('should create multiple notes for same user', async () => {
    const input1: CreateNoteInput = {
      title: 'First Note',
      content: 'First note content',
      user_id: userId
    };

    const input2: CreateNoteInput = {
      title: 'Second Note',
      content: 'Second note content',
      user_id: userId,
      category_id: categoryId
    };

    const result1 = await createNote(input1);
    const result2 = await createNote(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Note');
    expect(result2.title).toEqual('Second Note');
    expect(result1.category_id).toBeNull();
    expect(result2.category_id).toEqual(categoryId);

    // Verify both notes exist in database
    const allNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    expect(allNotes).toHaveLength(2);
  });
});
