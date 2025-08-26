import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notesTable, foldersTable } from '../db/schema';
import { getUserNotes } from '../handlers/get_user_notes';
import { eq } from 'drizzle-orm';

describe('getUserNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all notes for a user that are not in folders', async () => {
    // Create a test user
    const [user] = await db.insert(usersTable)
      .values({ email: 'test@example.com', name: 'Test User' })
      .returning()
      .execute();

    // Create notes for the user (not in folders)
    const [note1] = await db.insert(notesTable)
      .values({
        title: 'Note 1',
        content: 'Content 1',
        user_id: user.id,
        folder_id: null
      })
      .returning()
      .execute();

    const [note2] = await db.insert(notesTable)
      .values({
        title: 'Note 2',
        content: 'Content 2',
        user_id: user.id,
        folder_id: null
      })
      .returning()
      .execute();

    // Create a folder for the user
    const [folder] = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        user_id: user.id,
        parent_id: null
      })
      .returning()
      .execute();

    // Create a note in a folder (should not be returned)
    await db.insert(notesTable)
      .values({
        title: 'Note 3',
        content: 'Content 3',
        user_id: user.id,
        folder_id: folder.id
      })
      .execute();

    // Create a note for another user (should not be returned)
    const [otherUser] = await db.insert(usersTable)
      .values({ email: 'other@example.com', name: 'Other User' })
      .returning()
      .execute();

    await db.insert(notesTable)
      .values({
        title: 'Note 4',
        content: 'Content 4',
        user_id: otherUser.id,
        folder_id: null
      })
      .execute();

    // Fetch notes for the user
    const notes = await getUserNotes(user.id);

    // Should only return 2 notes that belong to the user and are not in folders
    expect(notes).toHaveLength(2);
    
    // Check that we got the right notes
    const noteTitles = notes.map(note => note.title);
    expect(noteTitles).toContain('Note 1');
    expect(noteTitles).toContain('Note 2');
    
    // Verify note structure
    const firstNote = notes[0];
    expect(firstNote.id).toBeDefined();
    expect(firstNote.title).toBeDefined();
    expect(firstNote.content).toBeDefined();
    expect(firstNote.user_id).toBe(user.id);
    expect(firstNote.folder_id).toBeNull();
    expect(firstNote.created_at).toBeInstanceOf(Date);
    expect(firstNote.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no notes', async () => {
    // Create a test user with no notes
    const [user] = await db.insert(usersTable)
      .values({ email: 'empty@example.com', name: 'Empty User' })
      .returning()
      .execute();

    const notes = await getUserNotes(user.id);
    expect(notes).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const notes = await getUserNotes(99999);
    expect(notes).toHaveLength(0);
  });
});
