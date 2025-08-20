import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testFolderId: number;
  let testNoteId: number;
  let secondFolderId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test folders
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: testUserId,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    testFolderId = folderResult[0].id;

    const secondFolderResult = await db.insert(foldersTable)
      .values({
        user_id: testUserId,
        name: 'Second Folder'
      })
      .returning()
      .execute();
    secondFolderId = secondFolderResult[0].id;

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        user_id: testUserId,
        folder_id: testFolderId,
        title: 'Original Title',
        content: 'Original content'
      })
      .returning()
      .execute();
    testNoteId = noteResult[0].id;
  });

  it('should update note title', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      title: 'Updated Title'
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(testNoteId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.folder_id).toEqual(testFolderId); // Should remain unchanged
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update note content', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      content: 'Updated content with more details'
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(testNoteId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Updated content with more details');
    expect(result.folder_id).toEqual(testFolderId); // Should remain unchanged
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should move note to different folder', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      folder_id: secondFolderId
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(testNoteId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.folder_id).toEqual(secondFolderId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should remove note from folder by setting folder_id to null', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      folder_id: null
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(testNoteId);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.folder_id).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      title: 'New Title',
      content: 'New content',
      folder_id: secondFolderId
    };

    const result = await updateNote(input);

    expect(result.id).toEqual(testNoteId);
    expect(result.title).toEqual('New Title');
    expect(result.content).toEqual('New content');
    expect(result.folder_id).toEqual(secondFolderId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      title: 'Database Test Title',
      content: 'Database test content'
    };

    await updateNote(input);

    // Verify changes are persisted in database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Database Test Title');
    expect(notes[0].content).toEqual('Database test content');
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when note does not exist', async () => {
    const input: UpdateNoteInput = {
      id: 99999, // Non-existent note ID
      title: 'This should fail'
    };

    await expect(updateNote(input)).rejects.toThrow(/Note with id 99999 not found/);
  });

  it('should handle empty string updates', async () => {
    const input: UpdateNoteInput = {
      id: testNoteId,
      title: '',
      content: ''
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('');
    expect(result.content).toEqual('');
    expect(result.id).toEqual(testNoteId);
    expect(result.user_id).toEqual(testUserId);
  });

  it('should update timestamp on any change', async () => {
    // Get original timestamp
    const originalNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNoteId))
      .execute();

    const originalUpdatedAt = originalNote[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateNoteInput = {
      id: testNoteId,
      title: 'Timestamp Test'
    };

    const result = await updateNote(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
