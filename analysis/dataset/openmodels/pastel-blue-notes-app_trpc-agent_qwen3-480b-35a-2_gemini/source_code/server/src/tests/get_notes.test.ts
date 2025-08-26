import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { getNotes } from '../handlers/get_notes';
import { eq } from 'drizzle-orm';

describe('getNotes', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password_here'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create another user to test isolation
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashed_password_here'
      })
      .returning()
      .execute();
    
    const otherUserId = otherUserResult[0].id;
    
    // Create a category for the test user
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create notes for the test user
    await db.insert(notesTable)
      .values([
        {
          title: 'Note 1',
          content: 'Content of note 1',
          user_id: userId,
          category_id: categoryId
        },
        {
          title: 'Note 2',
          content: 'Content of note 2',
          user_id: userId,
          category_id: null
        }
      ])
      .execute();
    
    // Create a note for the other user
    await db.insert(notesTable)
      .values({
        title: 'Other User Note',
        content: 'Content of other user note',
        user_id: otherUserId,
        category_id: null
      })
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all notes for a specific user', async () => {
    // Get the test user ID
    const users = await db.select().from(usersTable).where(eq(usersTable.email, 'test@example.com')).execute();
    const userId = users[0].id;
    
    const notes = await getNotes(userId);
    
    expect(notes).toHaveLength(2);
    
    // Check that we got the right notes (belonging to the user)
    const titles = notes.map(note => note.title);
    expect(titles).toContain('Note 1');
    expect(titles).toContain('Note 2');
    
    // Verify note structure
    const note1 = notes.find(note => note.title === 'Note 1');
    expect(note1).toBeDefined();
    expect(note1?.content).toBe('Content of note 1');
    expect(note1?.user_id).toBe(userId);
    expect(note1?.category_id).toBeGreaterThan(0);
    expect(note1?.created_at).toBeInstanceOf(Date);
    expect(note1?.updated_at).toBeInstanceOf(Date);
    
    const note2 = notes.find(note => note.title === 'Note 2');
    expect(note2).toBeDefined();
    expect(note2?.content).toBe('Content of note 2');
    expect(note2?.user_id).toBe(userId);
    expect(note2?.category_id).toBeNull();
  });

  it('should return an empty array when user has no notes', async () => {
    // Create a new user with no notes
    const newUserResult = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        password_hash: 'hashed_password_here'
      })
      .returning()
      .execute();
    
    const newUserId = newUserResult[0].id;
    
    const notes = await getNotes(newUserId);
    
    expect(notes).toHaveLength(0);
  });

  it('should not return notes belonging to other users', async () => {
    // Get the test user ID
    const users = await db.select().from(usersTable).where(eq(usersTable.email, 'test@example.com')).execute();
    const userId = users[0].id;
    
    const notes = await getNotes(userId);
    
    // Verify that we don't get the note belonging to the other user
    const otherUserNotes = notes.filter(note => note.title === 'Other User Note');
    expect(otherUserNotes).toHaveLength(0);
  });

  it('should return notes with and without categories', async () => {
    // Get the test user ID
    const users = await db.select().from(usersTable).where(eq(usersTable.email, 'test@example.com')).execute();
    const userId = users[0].id;
    
    const notes = await getNotes(userId);
    
    // Should have both notes - one with category and one without
    expect(notes).toHaveLength(2);
    
    const noteWithCategory = notes.find(note => note.title === 'Note 1');
    const noteWithoutCategory = notes.find(note => note.title === 'Note 2');
    
    expect(noteWithCategory).toBeDefined();
    expect(noteWithCategory?.category_id).toBeGreaterThan(0);
    
    expect(noteWithoutCategory).toBeDefined();
    expect(noteWithoutCategory?.category_id).toBeNull();
  });
});
