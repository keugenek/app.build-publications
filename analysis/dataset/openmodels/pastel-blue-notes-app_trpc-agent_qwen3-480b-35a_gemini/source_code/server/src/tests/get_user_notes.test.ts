import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { getUserNotes } from '../handlers/get_user_notes';
import { eq } from 'drizzle-orm';

describe('getUserNotes', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create another user for testing isolation
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        name: 'Other User'
      })
      .returning()
      .execute();
    
    const otherUserId = otherUserResult[0].id;
    
    // Create test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: userId,
        name: 'Test Folder'
      })
      .returning()
      .execute();
    
    const folderId = folderResult[0].id;
    
    // Create test notes
    await db.insert(notesTable)
      .values([
        {
          user_id: userId,
          folder_id: folderId,
          title: 'Note 1',
          content: 'Content 1',
          is_pinned: true
        },
        {
          user_id: userId,
          folder_id: null,
          title: 'Note 2',
          content: 'Content 2',
          is_pinned: false
        },
        {
          user_id: otherUserId, // Different user
          folder_id: null,
          title: 'Note 3',
          content: 'Content 3'
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all notes for a user', async () => {
    // Get the test user ID
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'test@example.com'))
      .execute()
      .then(results => results[0]);
    
    const notes = await getUserNotes(user.id);
    
    // Should return exactly 2 notes (only the ones belonging to the user)
    expect(notes).toHaveLength(2);
    
    // Validate note structure
    const note1 = notes.find(note => note.title === 'Note 1');
    const note2 = notes.find(note => note.title === 'Note 2');
    
    expect(note1).toBeDefined();
    expect(note1?.content).toBe('Content 1');
    expect(note1?.is_pinned).toBe(true);
    expect(note1?.folder_id).toBeGreaterThan(0);
    
    expect(note2).toBeDefined();
    expect(note2?.content).toBe('Content 2');
    expect(note2?.is_pinned).toBe(false);
    expect(note2?.folder_id).toBeNull();
    
    // Verify all notes belong to the user
    notes.forEach(note => {
      expect(note.user_id).toBe(user.id);
    });
  });

  it('should return empty array for user with no notes', async () => {
    // Create a user with no notes
    const newUserResult = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        name: 'Empty User'
      })
      .returning()
      .execute();
    
    const notes = await getUserNotes(newUserResult[0].id);
    
    expect(notes).toHaveLength(0);
  });

  it('should handle non-existent user', async () => {
    const notes = await getUserNotes(99999); // Non-existent user ID
    expect(notes).toHaveLength(0);
  });
});
