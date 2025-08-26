import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type GetNotesByFolderInput } from '../schema';
import { getNotesByFolder } from '../handlers/get_notes_by_folder';

describe('getNotesByFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: { id: number; email: string; password_hash: string; created_at: Date; updated_at: Date };
  let testFolder: { id: number; user_id: number; name: string; created_at: Date; updated_at: Date };
  let otherUser: { id: number; email: string; password_hash: string; created_at: Date; updated_at: Date };

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
          password_hash: 'other_hashed_password'
        }
      ])
      .returning()
      .execute();
    
    testUser = users[0];
    otherUser = users[1];

    // Create test folder
    const folders = await db.insert(foldersTable)
      .values({
        user_id: testUser.id,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    
    testFolder = folders[0];
  });

  it('should get notes in a specific folder', async () => {
    // Create notes in the test folder
    await db.insert(notesTable)
      .values([
        {
          user_id: testUser.id,
          folder_id: testFolder.id,
          title: 'Note 1',
          content: 'Content 1'
        },
        {
          user_id: testUser.id,
          folder_id: testFolder.id,
          title: 'Note 2',
          content: 'Content 2'
        },
        {
          user_id: testUser.id,
          folder_id: null, // This should not be returned
          title: 'Uncategorized Note',
          content: 'Uncategorized content'
        }
      ])
      .execute();

    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: testFolder.id
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Note 1');
    expect(result[0].content).toEqual('Content 1');
    expect(result[0].folder_id).toEqual(testFolder.id);
    expect(result[0].user_id).toEqual(testUser.id);
    expect(result[1].title).toEqual('Note 2');
    expect(result[1].content).toEqual('Content 2');
    expect(result[1].folder_id).toEqual(testFolder.id);
    expect(result[1].user_id).toEqual(testUser.id);
  });

  it('should get uncategorized notes when folder_id is null', async () => {
    // Create uncategorized notes and categorized notes
    await db.insert(notesTable)
      .values([
        {
          user_id: testUser.id,
          folder_id: null,
          title: 'Uncategorized Note 1',
          content: 'Uncategorized content 1'
        },
        {
          user_id: testUser.id,
          folder_id: null,
          title: 'Uncategorized Note 2',
          content: 'Uncategorized content 2'
        },
        {
          user_id: testUser.id,
          folder_id: testFolder.id, // This should not be returned
          title: 'Categorized Note',
          content: 'Categorized content'
        }
      ])
      .execute();

    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: null
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Uncategorized Note 1');
    expect(result[0].folder_id).toBeNull();
    expect(result[0].user_id).toEqual(testUser.id);
    expect(result[1].title).toEqual('Uncategorized Note 2');
    expect(result[1].folder_id).toBeNull();
    expect(result[1].user_id).toEqual(testUser.id);
  });

  it('should return empty array if folder does not exist', async () => {
    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: 999 // Non-existent folder ID
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array if user does not own the folder', async () => {
    // Create a folder for another user
    const otherUserFolder = await db.insert(foldersTable)
      .values({
        user_id: otherUser.id,
        name: 'Other User Folder'
      })
      .returning()
      .execute();

    // Create notes in that folder
    await db.insert(notesTable)
      .values({
        user_id: otherUser.id,
        folder_id: otherUserFolder[0].id,
        title: 'Other User Note',
        content: 'Other user content'
      })
      .execute();

    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: otherUserFolder[0].id // Trying to access other user's folder
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array if no notes exist in folder', async () => {
    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: testFolder.id
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(0);
  });

  it('should only return notes for the specified user', async () => {
    // Create notes for both users in different folders
    await db.insert(notesTable)
      .values([
        {
          user_id: testUser.id,
          folder_id: testFolder.id,
          title: 'User 1 Note',
          content: 'User 1 content'
        },
        {
          user_id: otherUser.id,
          folder_id: testFolder.id, // Same folder ID but different user
          title: 'User 2 Note',
          content: 'User 2 content'
        }
      ])
      .execute();

    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: testFolder.id
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Note');
    expect(result[0].user_id).toEqual(testUser.id);
  });

  it('should return notes ordered by creation date', async () => {
    // Create notes with slight delay to ensure different timestamps
    const note1 = await db.insert(notesTable)
      .values({
        user_id: testUser.id,
        folder_id: testFolder.id,
        title: 'First Note',
        content: 'First content'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const note2 = await db.insert(notesTable)
      .values({
        user_id: testUser.id,
        folder_id: testFolder.id,
        title: 'Second Note',
        content: 'Second content'
      })
      .returning()
      .execute();

    const input: GetNotesByFolderInput = {
      user_id: testUser.id,
      folder_id: testFolder.id
    };

    const result = await getNotesByFolder(input);

    expect(result).toHaveLength(2);
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
    expect(result[0].title).toEqual('First Note');
    expect(result[1].title).toEqual('Second Note');
  });
});
