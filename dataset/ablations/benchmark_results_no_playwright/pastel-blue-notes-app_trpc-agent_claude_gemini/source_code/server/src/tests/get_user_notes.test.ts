import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type GetUserNotesInput } from '../schema';
import { getUserNotes } from '../handlers/get_user_notes';
import { eq } from 'drizzle-orm';

// Test data
const testUser1 = {
  email: 'user1@example.com',
  password_hash: 'hashed_password_1'
};

const testUser2 = {
  email: 'user2@example.com',
  password_hash: 'hashed_password_2'
};

const testFolder = {
  name: 'Test Folder'
};

describe('getUserNotes', () => {
  let userId1: number;
  let userId2: number;
  let folderId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const userResults = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    userId1 = userResults[0].id;
    userId2 = userResults[1].id;

    // Create test folder for user1
    const folderResult = await db.insert(foldersTable)
      .values({ ...testFolder, user_id: userId1 })
      .returning()
      .execute();

    folderId = folderResult[0].id;
  });

  afterEach(resetDB);

  it('should return empty array when user has no notes', async () => {
    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all notes for a user', async () => {
    // Create test notes for user1
    await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: folderId,
          title: 'First Note',
          content: 'Content of first note'
        },
        {
          user_id: userId1,
          folder_id: null,
          title: 'Second Note',
          content: 'Content of second note'
        }
      ])
      .execute();

    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(2);
    expect(result.map(note => note.title)).toContain('First Note');
    expect(result.map(note => note.title)).toContain('Second Note');

    // Verify all notes belong to the correct user
    result.forEach(note => {
      expect(note.user_id).toEqual(userId1);
    });
  });

  it('should only return notes for the specified user', async () => {
    // Create notes for both users
    await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: folderId,
          title: 'User 1 Note',
          content: 'Content for user 1'
        },
        {
          user_id: userId2,
          folder_id: null,
          title: 'User 2 Note',
          content: 'Content for user 2'
        }
      ])
      .execute();

    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Note');
    expect(result[0].user_id).toEqual(userId1);
  });

  it('should return notes ordered by updated_at desc (most recent first)', async () => {
    const now = new Date();
    const olderDate = new Date(now.getTime() - 60000); // 1 minute ago

    // Insert notes with different timestamps
    const noteResults = await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: null,
          title: 'Older Note',
          content: 'This is an older note'
        }
      ])
      .returning()
      .execute();

    // Update the first note to have an older timestamp
    await db.update(notesTable)
      .set({ updated_at: olderDate })
      .where(eq(notesTable.id, noteResults[0].id))
      .execute();

    // Add a newer note
    await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: folderId,
          title: 'Newer Note',
          content: 'This is a newer note'
        }
      ])
      .execute();

    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(2);
    
    // First result should be the newer note
    expect(result[0].title).toEqual('Newer Note');
    expect(result[1].title).toEqual('Older Note');

    // Verify the order by checking timestamps
    expect(result[0].updated_at.getTime()).toBeGreaterThan(result[1].updated_at.getTime());
  });

  it('should include notes with and without folder assignments', async () => {
    await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: folderId,
          title: 'Note in Folder',
          content: 'This note is in a folder'
        },
        {
          user_id: userId1,
          folder_id: null,
          title: 'Note without Folder',
          content: 'This note has no folder'
        }
      ])
      .execute();

    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(2);
    
    const folderNote = result.find(note => note.title === 'Note in Folder');
    const noFolderNote = result.find(note => note.title === 'Note without Folder');

    expect(folderNote).toBeDefined();
    expect(folderNote?.folder_id).toEqual(folderId);

    expect(noFolderNote).toBeDefined();
    expect(noFolderNote?.folder_id).toBeNull();
  });

  it('should return notes with all required fields', async () => {
    await db.insert(notesTable)
      .values([
        {
          user_id: userId1,
          folder_id: folderId,
          title: 'Complete Note',
          content: 'This note has all fields'
        }
      ])
      .execute();

    const input: GetUserNotesInput = {
      user_id: userId1
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(1);
    
    const note = result[0];
    expect(note.id).toBeDefined();
    expect(typeof note.id).toBe('number');
    expect(note.user_id).toEqual(userId1);
    expect(note.folder_id).toEqual(folderId);
    expect(note.title).toEqual('Complete Note');
    expect(note.content).toEqual('This note has all fields');
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent user', async () => {
    const nonExistentUserId = 99999;
    
    const input: GetUserNotesInput = {
      user_id: nonExistentUserId
    };

    const result = await getUserNotes(input);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });
});
