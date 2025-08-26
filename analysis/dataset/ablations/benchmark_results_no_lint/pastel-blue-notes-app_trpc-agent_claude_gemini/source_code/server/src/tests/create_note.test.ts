import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: { id: number; email: string; password_hash: string; created_at: Date; updated_at: Date };
  let testCategory: { id: number; name: string; user_id: number; created_at: Date; updated_at: Date };

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: testUser.id
      })
      .returning()
      .execute();
    testCategory = categoryResult[0];
  });

  it('should create a note without category', async () => {
    const input: CreateNoteInput = {
      title: 'Test Note',
      content: 'This is a test note content',
      user_id: testUser.id
    };

    const result = await createNote(input);

    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.user_id).toEqual(testUser.id);
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with category', async () => {
    const input: CreateNoteInput = {
      title: 'Categorized Note',
      content: 'This note has a category',
      user_id: testUser.id,
      category_id: testCategory.id
    };

    const result = await createNote(input);

    expect(result.title).toEqual('Categorized Note');
    expect(result.content).toEqual('This note has a category');
    expect(result.user_id).toEqual(testUser.id);
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const input: CreateNoteInput = {
      title: 'Database Test Note',
      content: 'Testing database persistence',
      user_id: testUser.id,
      category_id: testCategory.id
    };

    const result = await createNote(input);

    // Query the database to verify the note was saved
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Database Test Note');
    expect(notes[0].content).toEqual('Testing database persistence');
    expect(notes[0].user_id).toEqual(testUser.id);
    expect(notes[0].category_id).toEqual(testCategory.id);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create note with null category_id when not provided', async () => {
    const input: CreateNoteInput = {
      title: 'No Category Note',
      content: 'This note has no category',
      user_id: testUser.id,
      category_id: null
    };

    const result = await createNote(input);

    expect(result.category_id).toBeNull();

    // Verify in database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes[0].category_id).toBeNull();
  });

  it('should throw error when user does not exist', async () => {
    const input: CreateNoteInput = {
      title: 'Invalid User Note',
      content: 'This should fail',
      user_id: 99999 // Non-existent user ID
    };

    await expect(createNote(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when category does not exist', async () => {
    const input: CreateNoteInput = {
      title: 'Invalid Category Note',
      content: 'This should fail',
      user_id: testUser.id,
      category_id: 99999 // Non-existent category ID
    };

    await expect(createNote(input)).rejects.toThrow(/category not found/i);
  });

  it('should throw error when category belongs to different user', async () => {
    // Create another user
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'other_password'
      })
      .returning()
      .execute();
    const otherUser = otherUserResult[0];

    // Create category for other user
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other User Category',
        user_id: otherUser.id
      })
      .returning()
      .execute();
    const otherCategory = otherCategoryResult[0];

    // Try to create note with testUser but otherUser's category
    const input: CreateNoteInput = {
      title: 'Wrong Owner Note',
      content: 'This should fail',
      user_id: testUser.id,
      category_id: otherCategory.id
    };

    await expect(createNote(input)).rejects.toThrow(/category does not belong to user/i);
  });

  it('should create multiple notes for same user', async () => {
    const input1: CreateNoteInput = {
      title: 'First Note',
      content: 'First note content',
      user_id: testUser.id
    };

    const input2: CreateNoteInput = {
      title: 'Second Note',
      content: 'Second note content',
      user_id: testUser.id,
      category_id: testCategory.id
    };

    const result1 = await createNote(input1);
    const result2 = await createNote(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Note');
    expect(result2.title).toEqual('Second Note');
    expect(result1.category_id).toBeNull();
    expect(result2.category_id).toEqual(testCategory.id);

    // Verify both notes exist in database
    const allNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, testUser.id))
      .execute();

    expect(allNotes).toHaveLength(2);
  });
});
