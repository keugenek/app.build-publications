import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq, and } from 'drizzle-orm';

describe('createNote', () => {
  let testUserId: number;
  let testFolderId: number;
  let otherUserId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashedpassword123'
        },
        {
          email: 'other@example.com',
          password_hash: 'hashedpassword456'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create a test folder for the first user
    const folders = await db.insert(foldersTable)
      .values({
        user_id: testUserId,
        name: 'Test Folder'
      })
      .returning()
      .execute();

    testFolderId = folders[0].id;
  });

  afterEach(resetDB);

  const baseInput: CreateNoteInput = {
    user_id: 0, // Will be set in tests
    folder_id: null,
    title: 'Test Note',
    content: 'This is a test note content'
  };

  it('should create a note without folder', async () => {
    const input = {
      ...baseInput,
      user_id: testUserId
    };

    const result = await createNote(input);

    // Validate returned note
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.folder_id).toBeNull();
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with folder', async () => {
    const input = {
      ...baseInput,
      user_id: testUserId,
      folder_id: testFolderId
    };

    const result = await createNote(input);

    // Validate returned note
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.folder_id).toEqual(testFolderId);
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const input = {
      ...baseInput,
      user_id: testUserId,
      folder_id: testFolderId
    };

    const result = await createNote(input);

    // Verify note exists in database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].user_id).toEqual(testUserId);
    expect(notes[0].folder_id).toEqual(testFolderId);
    expect(notes[0].title).toEqual('Test Note');
    expect(notes[0].content).toEqual('This is a test note content');
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...baseInput,
      user_id: 99999 // Non-existent user ID
    };

    await expect(createNote(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent folder', async () => {
    const input = {
      ...baseInput,
      user_id: testUserId,
      folder_id: 99999 // Non-existent folder ID
    };

    await expect(createNote(input)).rejects.toThrow(/folder not found/i);
  });

  it('should throw error when folder belongs to different user', async () => {
    // Create folder for different user
    const otherUserFolder = await db.insert(foldersTable)
      .values({
        user_id: otherUserId,
        name: 'Other User Folder'
      })
      .returning()
      .execute();

    const input = {
      ...baseInput,
      user_id: testUserId,
      folder_id: otherUserFolder[0].id // Folder belonging to other user
    };

    await expect(createNote(input)).rejects.toThrow(/folder not found or does not belong to user/i);
  });

  it('should handle empty content', async () => {
    const input = {
      ...baseInput,
      user_id: testUserId,
      content: '' // Empty content
    };

    const result = await createNote(input);

    expect(result.content).toEqual('');
    expect(result.id).toBeDefined();
  });

  it('should handle long content', async () => {
    const longContent = 'A'.repeat(10000); // Very long content
    const input = {
      ...baseInput,
      user_id: testUserId,
      content: longContent
    };

    const result = await createNote(input);

    expect(result.content).toEqual(longContent);
    expect(result.id).toBeDefined();
  });

  it('should allow multiple notes for same user', async () => {
    const input1 = {
      ...baseInput,
      user_id: testUserId,
      title: 'First Note'
    };

    const input2 = {
      ...baseInput,
      user_id: testUserId,
      title: 'Second Note'
    };

    const result1 = await createNote(input1);
    const result2 = await createNote(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Note');
    expect(result2.title).toEqual('Second Note');

    // Verify both notes exist in database
    const userNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, testUserId))
      .execute();

    expect(userNotes).toHaveLength(2);
  });
});
