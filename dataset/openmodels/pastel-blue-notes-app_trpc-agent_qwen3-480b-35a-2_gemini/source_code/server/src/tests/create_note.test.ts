import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateNoteInput = {
  title: 'Test Note',
  content: 'This is a test note content',
  category_id: null
};

describe('createNote', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should create a note without category', async () => {
    // First create a user since notes require a user_id
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const result = await createNote(testInput, userId);

    // Basic field validation
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note content');
    expect(result.user_id).toEqual(userId);
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with category', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        user_id: userId
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    const inputWithCategory: CreateNoteInput = {
      title: 'Test Note with Category',
      content: 'This is a test note with category',
      category_id: categoryId
    };

    const result = await createNote(inputWithCategory, userId);

    // Basic field validation
    expect(result.title).toEqual('Test Note with Category');
    expect(result.content).toEqual('This is a test note with category');
    expect(result.user_id).toEqual(userId);
    expect(result.category_id).toEqual(categoryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    // First create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    
    const result = await createNote(testInput, userId);

    // Query using proper drizzle syntax
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Test Note');
    expect(notes[0].content).toEqual('This is a test note content');
    expect(notes[0].user_id).toEqual(userId);
    expect(notes[0].category_id).toBeNull();
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });
});
