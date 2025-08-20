import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type GetNotesByUserInput } from '../schema';
import { getNotesByUser } from '../handlers/get_notes_by_user';
import { eq } from 'drizzle-orm';

describe('getNotesByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let testCategoryId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword123'
        },
        {
          username: 'otheruser',
          email: 'other@example.com',
          password_hash: 'hashedpassword456'
        }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: testUserId
      })
      .returning()
      .execute();
    
    testCategoryId = categories[0].id;
  });

  it('should return all notes for a user', async () => {
    // Create multiple notes for test user
    const notesData = [
      {
        title: 'First Note',
        content: 'Content of first note',
        user_id: testUserId,
        category_id: testCategoryId
      },
      {
        title: 'Second Note',
        content: 'Content of second note',
        user_id: testUserId,
        category_id: null
      },
      {
        title: 'Third Note',
        content: 'Content of third note',
        user_id: testUserId,
        category_id: testCategoryId
      }
    ];

    await db.insert(notesTable)
      .values(notesData)
      .execute();

    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(3);
    
    // Verify all returned notes belong to the correct user
    result.forEach(note => {
      expect(note.user_id).toEqual(testUserId);
    });

    // Verify note content
    const titles = result.map(note => note.title);
    expect(titles).toContain('First Note');
    expect(titles).toContain('Second Note');
    expect(titles).toContain('Third Note');
  });

  it('should return notes ordered by created_at descending (most recent first)', async () => {
    // Create notes with slight delay to ensure different timestamps
    await db.insert(notesTable)
      .values({
        title: 'Oldest Note',
        content: 'This was created first',
        user_id: testUserId,
        category_id: null
      })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(notesTable)
      .values({
        title: 'Middle Note',
        content: 'This was created second',
        user_id: testUserId,
        category_id: null
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(notesTable)
      .values({
        title: 'Newest Note',
        content: 'This was created last',
        user_id: testUserId,
        category_id: null
      })
      .execute();

    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].title).toEqual('Newest Note');
    expect(result[1].title).toEqual('Middle Note');
    expect(result[2].title).toEqual('Oldest Note');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return empty array for user with no notes', async () => {
    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return notes for the specified user', async () => {
    // Create notes for both users
    await db.insert(notesTable)
      .values([
        {
          title: 'Test User Note',
          content: 'This belongs to test user',
          user_id: testUserId,
          category_id: null
        },
        {
          title: 'Other User Note',
          content: 'This belongs to other user',
          user_id: otherUserId,
          category_id: null
        }
      ])
      .execute();

    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test User Note');
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should handle notes with and without categories correctly', async () => {
    // Create notes with mixed category assignments
    await db.insert(notesTable)
      .values([
        {
          title: 'Categorized Note',
          content: 'This has a category',
          user_id: testUserId,
          category_id: testCategoryId
        },
        {
          title: 'Uncategorized Note',
          content: 'This has no category',
          user_id: testUserId,
          category_id: null
        }
      ])
      .execute();

    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(2);
    
    const categorizedNote = result.find(note => note.title === 'Categorized Note');
    const uncategorizedNote = result.find(note => note.title === 'Uncategorized Note');

    expect(categorizedNote).toBeDefined();
    expect(categorizedNote!.category_id).toEqual(testCategoryId);
    
    expect(uncategorizedNote).toBeDefined();
    expect(uncategorizedNote!.category_id).toBeNull();
  });

  it('should return empty array for non-existent user', async () => {
    // Create a note for existing user
    await db.insert(notesTable)
      .values({
        title: 'Test Note',
        content: 'Some content',
        user_id: testUserId,
        category_id: null
      })
      .execute();

    // Query for non-existent user
    const input: GetNotesByUserInput = {
      user_id: 99999
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should verify database consistency after retrieval', async () => {
    // Create a note
    const noteData = {
      title: 'Consistency Test Note',
      content: 'Testing database consistency',
      user_id: testUserId,
      category_id: testCategoryId
    };

    await db.insert(notesTable)
      .values(noteData)
      .execute();

    const input: GetNotesByUserInput = {
      user_id: testUserId
    };

    const result = await getNotesByUser(input);

    expect(result).toHaveLength(1);

    // Verify the note exists in database with correct data
    const dbNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result[0].id))
      .execute();

    expect(dbNotes).toHaveLength(1);
    expect(dbNotes[0].title).toEqual('Consistency Test Note');
    expect(dbNotes[0].content).toEqual('Testing database consistency');
    expect(dbNotes[0].user_id).toEqual(testUserId);
    expect(dbNotes[0].category_id).toEqual(testCategoryId);
    expect(dbNotes[0].created_at).toBeInstanceOf(Date);
    expect(dbNotes[0].updated_at).toBeInstanceOf(Date);
  });
});
