import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type GetUserNotesInput } from '../schema';
import { getUserNotes } from '../handlers/get_user_notes';
import { eq } from 'drizzle-orm';

describe('getUserNotes', () => {
  let testUserId: number;
  let testUser2Id: number;
  let testCategoryId: number;
  let testCategory2Id: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password'
        },
        {
          email: 'test2@example.com',
          password_hash: 'hashed_password2'
        }
      ])
      .returning()
      .execute();
    
    testUserId = users[0].id;
    testUser2Id = users[1].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        {
          name: 'Work',
          user_id: testUserId
        },
        {
          name: 'Personal',
          user_id: testUserId
        }
      ])
      .returning()
      .execute();
    
    testCategoryId = categories[0].id;
    testCategory2Id = categories[1].id;

    // Create test notes
    await db.insert(notesTable)
      .values([
        {
          title: 'Note 1',
          content: 'Content 1',
          user_id: testUserId,
          category_id: testCategoryId
        },
        {
          title: 'Note 2',
          content: 'Content 2',
          user_id: testUserId,
          category_id: testCategory2Id
        },
        {
          title: 'Note 3',
          content: 'Content 3',
          user_id: testUserId,
          category_id: null
        },
        {
          title: 'Other User Note',
          content: 'Other content',
          user_id: testUser2Id,
          category_id: null
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should get all notes for a user', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(3);
    
    // Should only return notes for the specified user
    result.forEach(note => {
      expect(note.user_id).toEqual(testUserId);
    });

    // Check that all expected notes are returned
    const noteTitles = result.map(note => note.title);
    expect(noteTitles).toContain('Note 1');
    expect(noteTitles).toContain('Note 2');
    expect(noteTitles).toContain('Note 3');
    expect(noteTitles).not.toContain('Other User Note');
  });

  it('should get notes filtered by category', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId,
      category_id: testCategoryId
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Note 1');
    expect(result[0].category_id).toEqual(testCategoryId);
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should get notes with null category when filtered by null', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId,
      category_id: null as any // Type assertion needed since schema expects number | undefined
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Note 3');
    expect(result[0].category_id).toBeNull();
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should return empty array for user with no notes', async () => {
    // Create a new user with no notes
    const newUser = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const input: GetUserNotesInput = {
      user_id: newUser[0].id
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId,
      category_id: 99999 // Non-existent category ID
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(0);
  });

  it('should return notes ordered by updated_at DESC', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId
    };

    const result = await getUserNotes(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering - each note should have updated_at >= the next one
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].updated_at >= result[i + 1].updated_at).toBe(true);
    }
    
    // Also verify that all timestamps are Date objects
    result.forEach(note => {
      expect(note.updated_at).toBeInstanceOf(Date);
      expect(note.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return notes with all required fields', async () => {
    const input: GetUserNotesInput = {
      user_id: testUserId
    };

    const result = await getUserNotes(input);
    
    expect(result.length).toBeGreaterThan(0);
    
    const note = result[0];
    expect(note.id).toBeDefined();
    expect(typeof note.id).toBe('number');
    expect(note.title).toBeDefined();
    expect(typeof note.title).toBe('string');
    expect(note.content).toBeDefined();
    expect(typeof note.content).toBe('string');
    expect(note.user_id).toBeDefined();
    expect(typeof note.user_id).toBe('number');
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
    // category_id can be null or number
    expect(note.category_id === null || typeof note.category_id === 'number').toBe(true);
  });
});
