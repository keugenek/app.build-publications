import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type DeleteFolderInput } from '../schema';
import { deleteFolder } from '../handlers/delete_folder';
import { eq, and } from 'drizzle-orm';

describe('deleteFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a folder', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create a test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    const folder = folderResult[0];

    const input: DeleteFolderInput = {
      id: folder.id,
      user_id: user.id
    };

    const result = await deleteFolder(input);

    expect(result.success).toBe(true);

    // Verify folder is deleted
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(0);
  });

  it('should move notes to uncategorized (null folder_id) when folder is deleted', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create a test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    const folder = folderResult[0];

    // Create notes in the folder
    const note1Result = await db.insert(notesTable)
      .values({
        user_id: user.id,
        folder_id: folder.id,
        title: 'Note 1',
        content: 'Content 1'
      })
      .returning()
      .execute();

    const note2Result = await db.insert(notesTable)
      .values({
        user_id: user.id,
        folder_id: folder.id,
        title: 'Note 2',
        content: 'Content 2'
      })
      .returning()
      .execute();

    const input: DeleteFolderInput = {
      id: folder.id,
      user_id: user.id
    };

    const result = await deleteFolder(input);

    expect(result.success).toBe(true);

    // Verify folder is deleted
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(0);

    // Verify notes still exist but with null folder_id
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, user.id))
      .execute();

    expect(notes).toHaveLength(2);
    notes.forEach(note => {
      expect(note.folder_id).toBeNull();
    });

    // Verify specific notes exist with correct titles
    const noteTitles = notes.map(note => note.title).sort();
    expect(noteTitles).toEqual(['Note 1', 'Note 2']);
  });

  it('should throw error when folder does not exist', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: DeleteFolderInput = {
      id: 999, // Non-existent folder ID
      user_id: user.id
    };

    await expect(deleteFolder(input)).rejects.toThrow(/folder not found or access denied/i);
  });

  it('should throw error when user tries to delete another user\'s folder', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();
    const user1 = user1Result[0];

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Create a folder for user1
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user1.id,
        name: 'User1 Folder'
      })
      .returning()
      .execute();
    const folder = folderResult[0];

    // Try to delete user1's folder as user2
    const input: DeleteFolderInput = {
      id: folder.id,
      user_id: user2.id
    };

    await expect(deleteFolder(input)).rejects.toThrow(/folder not found or access denied/i);

    // Verify folder still exists
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('User1 Folder');
  });

  it('should handle deletion of folder with no notes', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create a folder with no notes
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Empty Folder'
      })
      .returning()
      .execute();
    const folder = folderResult[0];

    const input: DeleteFolderInput = {
      id: folder.id,
      user_id: user.id
    };

    const result = await deleteFolder(input);

    expect(result.success).toBe(true);

    // Verify folder is deleted
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(0);
  });

  it('should handle deletion of folder with mixed notes (some in folder, some uncategorized)', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create a test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: user.id,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    const folder = folderResult[0];

    // Create notes: some in folder, some uncategorized
    await db.insert(notesTable)
      .values({
        user_id: user.id,
        folder_id: folder.id,
        title: 'Folder Note',
        content: 'In folder content'
      })
      .execute();

    await db.insert(notesTable)
      .values({
        user_id: user.id,
        folder_id: null, // Already uncategorized
        title: 'Uncategorized Note',
        content: 'Uncategorized content'
      })
      .execute();

    const input: DeleteFolderInput = {
      id: folder.id,
      user_id: user.id
    };

    const result = await deleteFolder(input);

    expect(result.success).toBe(true);

    // Verify all notes are now uncategorized
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, user.id))
      .execute();

    expect(notes).toHaveLength(2);
    notes.forEach(note => {
      expect(note.folder_id).toBeNull();
    });

    // Verify both notes still exist with correct titles
    const noteTitles = notes.map(note => note.title).sort();
    expect(noteTitles).toEqual(['Folder Note', 'Uncategorized Note']);
  });
});
