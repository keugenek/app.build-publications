import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteNote } from '../handlers/delete_note';

describe('deleteNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a note owned by the user', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user = userResult[0];
    
    // Then create a note for that user
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'This is a test note',
        user_id: user.id,
      })
      .returning()
      .execute();
    
    const note = noteResult[0];
    
    // Delete the note
    await deleteNote(note.id, user.id);
    
    // Verify the note was deleted
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();
    
    expect(notes).toHaveLength(0);
  });

  it('should throw an error when trying to delete a note that does not exist', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user = userResult[0];
    
    // Try to delete a non-existent note
    await expect(deleteNote(99999, user.id)).rejects.toThrow('Note not found or unauthorized');
  });

  it('should throw an error when trying to delete a note owned by another user', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user1 = user1Result[0];
    
    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
      })
      .returning()
      .execute();
    
    const user2 = user2Result[0];
    
    // Create a note for user1
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'This is a test note',
        user_id: user1.id,
      })
      .returning()
      .execute();
    
    const note = noteResult[0];
    
    // Try to delete user1's note as user2
    await expect(deleteNote(note.id, user2.id)).rejects.toThrow('Note not found or unauthorized');
    
    // Verify the note still exists
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, note.id))
      .execute();
    
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe(note.id);
  });
});
