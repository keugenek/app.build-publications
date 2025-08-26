import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, notesTable } from '../db/schema';
import { type UpdateNoteInput } from '../schema';
import { updateNote } from '../handlers/update_note';
import { eq, and } from 'drizzle-orm';

describe('updateNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: { id: number; username: string; email: string; password_hash: string; created_at: Date; updated_at: Date; };
  let testCategory: { id: number; name: string; user_id: number; created_at: Date; updated_at: Date; };
  let testNote: { id: number; title: string; content: string; user_id: number; category_id: number | null; created_at: Date; updated_at: Date; };
  let otherUser: { id: number; username: string; email: string; password_hash: string; created_at: Date; updated_at: Date; };
  let otherCategory: { id: number; name: string; user_id: number; created_at: Date; updated_at: Date; };

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create another user for access control tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    otherUser = otherUserResult[0];

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: testUser.id
      })
      .returning()
      .execute();
    testCategory = categoryResult[0];

    // Create category for other user
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        user_id: otherUser.id
      })
      .returning()
      .execute();
    otherCategory = otherCategoryResult[0];

    // Create test note
    const noteResult = await db.insert(notesTable)
      .values({
        title: 'Original Title',
        content: 'Original content',
        user_id: testUser.id,
        category_id: testCategory.id
      })
      .returning()
      .execute();
    testNote = noteResult[0];
  });

  it('should update note title only', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      title: 'Updated Title',
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content');
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.id).toEqual(testNote.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testNote.updated_at).toBe(true);
  });

  it('should update note content only', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      content: 'Updated content',
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Updated content');
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testNote.updated_at).toBe(true);
  });

  it('should update note category only', async () => {
    // Create another category for the same user
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        user_id: testUser.id
      })
      .returning()
      .execute();
    const newCategory = newCategoryResult[0];

    const input: UpdateNoteInput = {
      id: testNote.id,
      category_id: newCategory.id,
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
    expect(result.category_id).toEqual(newCategory.id);
    expect(result.updated_at > testNote.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      title: 'New Title',
      content: 'New content',
      category_id: null,
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('New Title');
    expect(result.content).toEqual('New content');
    expect(result.category_id).toBeNull();
    expect(result.updated_at > testNote.updated_at).toBe(true);
  });

  it('should set category to null', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      category_id: null,
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.category_id).toBeNull();
    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
  });

  it('should save changes to database', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      title: 'Database Updated Title',
      content: 'Database updated content',
      user_id: testUser.id
    };

    await updateNote(input);

    const savedNote = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, testNote.id))
      .execute();

    expect(savedNote).toHaveLength(1);
    expect(savedNote[0].title).toEqual('Database Updated Title');
    expect(savedNote[0].content).toEqual('Database updated content');
    expect(savedNote[0].updated_at).toBeInstanceOf(Date);
    expect(savedNote[0].updated_at > testNote.updated_at).toBe(true);
  });

  it('should throw error when note does not exist', async () => {
    const input: UpdateNoteInput = {
      id: 999999,
      title: 'Updated Title',
      user_id: testUser.id
    };

    expect(updateNote(input)).rejects.toThrow(/note not found or access denied/i);
  });

  it('should throw error when user tries to update another users note', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      title: 'Unauthorized Update',
      user_id: otherUser.id
    };

    expect(updateNote(input)).rejects.toThrow(/note not found or access denied/i);
  });

  it('should throw error when category does not exist', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      category_id: 999999,
      user_id: testUser.id
    };

    expect(updateNote(input)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should throw error when user tries to assign note to another users category', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      category_id: otherCategory.id,
      user_id: testUser.id
    };

    expect(updateNote(input)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should handle empty string fields', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      title: '',
      content: '',
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('');
    expect(result.content).toEqual('');
    expect(result.category_id).toEqual(testCategory.id);
  });

  it('should preserve original values when fields are not provided', async () => {
    const input: UpdateNoteInput = {
      id: testNote.id,
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Original Title');
    expect(result.content).toEqual('Original content');
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.updated_at > testNote.updated_at).toBe(true);
  });

  it('should update notes with null category_id initially', async () => {
    // Create note without category
    const noteWithoutCategoryResult = await db.insert(notesTable)
      .values({
        title: 'No Category Note',
        content: 'Content without category',
        user_id: testUser.id,
        category_id: null
      })
      .returning()
      .execute();
    const noteWithoutCategory = noteWithoutCategoryResult[0];

    const input: UpdateNoteInput = {
      id: noteWithoutCategory.id,
      title: 'Updated No Category Note',
      category_id: testCategory.id,
      user_id: testUser.id
    };

    const result = await updateNote(input);

    expect(result.title).toEqual('Updated No Category Note');
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.content).toEqual('Content without category');
  });
});
