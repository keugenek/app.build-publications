import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { getNote } from '../handlers/get_note';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123'
};

const testUser2 = {
  email: 'test2@example.com',
  password_hash: 'hashedpassword456'
};

const testCategory = {
  name: 'Test Category',
  color: '#FF5733'
};

const testNote = {
  title: 'Test Note',
  content: 'This is a test note content'
};

describe('getNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return note when user owns it', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        category_id: categoryId,
        user_id: userId
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Test getting the note
    const result = await getNote(noteId, userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(noteId);
    expect(result!.title).toEqual('Test Note');
    expect(result!.content).toEqual('This is a test note content');
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return note without category', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test note without category
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        category_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Test getting the note
    const result = await getNote(noteId, userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(noteId);
    expect(result!.title).toEqual('Test Note');
    expect(result!.content).toEqual('This is a test note content');
    expect(result!.category_id).toBeNull();
    expect(result!.user_id).toEqual(userId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when note does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const nonExistentNoteId = 999999;

    // Test getting non-existent note
    const result = await getNote(nonExistentNoteId, userId);

    expect(result).toBeNull();
  });

  it('should return null when user does not own the note', async () => {
    // Create test users
    const userResult1 = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    const userResult2 = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create test note for user 1
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        category_id: null,
        user_id: userId1
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Test user 2 trying to access user 1's note
    const result = await getNote(noteId, userId2);

    expect(result).toBeNull();
  });

  it('should return null when user ID is invalid', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        ...testNote,
        category_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    const invalidUserId = 999999;

    // Test getting note with invalid user ID
    const result = await getNote(noteId, invalidUserId);

    expect(result).toBeNull();
  });

  it('should handle valid note with existing category correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Personal',
        color: '#3498DB',
        user_id: userId
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test note with long content
    const longNote = {
      title: 'Detailed Note',
      content: 'This is a very detailed note with a lot of content to test that the handler can properly retrieve notes with various content lengths and special characters like @#$%^&*()'
    };

    const noteResult = await db.insert(notesTable)
      .values({
        ...longNote,
        category_id: categoryId,
        user_id: userId
      })
      .returning()
      .execute();
    const noteId = noteResult[0].id;

    // Test getting the detailed note
    const result = await getNote(noteId, userId);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Detailed Note');
    expect(result!.content).toEqual(longNote.content);
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.user_id).toEqual(userId);
    
    // Verify timestamps are properly set
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result!.updated_at.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
