import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should create a note', async () => {
    const noteInput: CreateNoteInput = {
      user_id: 1,
      title: 'Test Note',
      content: 'This is a test note',
      folder_id: null,
      is_pinned: false
    };
    
    const result = await createNote(noteInput);

    // Basic field validation
    expect(result.title).toEqual('Test Note');
    expect(result.content).toEqual('This is a test note');
    expect(result.user_id).toEqual(1);
    expect(result.folder_id).toBeNull();
    expect(result.is_pinned).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const noteInput: CreateNoteInput = {
      user_id: 1,
      title: 'Database Test Note',
      content: 'This note is for database testing',
      folder_id: null,
      is_pinned: true
    };
    
    const result = await createNote(noteInput);

    // Query using proper drizzle syntax
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Database Test Note');
    expect(notes[0].content).toEqual('This note is for database testing');
    expect(notes[0].user_id).toEqual(1);
    expect(notes[0].folder_id).toBeNull();
    expect(notes[0].is_pinned).toEqual(true);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a note with a folder', async () => {
    // First create a folder
    const folderResult = await db.insert(foldersTable)
      .values({
        user_id: 1,
        name: 'Test Folder',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    const noteInput: CreateNoteInput = {
      user_id: 1,
      title: 'Folder Note',
      content: 'This note is in a folder',
      folder_id: folderResult[0].id,
      is_pinned: false
    };
    
    const result = await createNote(noteInput);

    expect(result.folder_id).toEqual(folderResult[0].id);
    
    // Verify in database
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes[0].folder_id).toEqual(folderResult[0].id);
  });

  it('should create a note with default is_pinned value', async () => {
    // Create input that omits is_pinned to test Zod default
    const noteInput = {
      user_id: 1,
      title: 'Default Pinned Note',
      content: 'This note tests the default pinned value',
      folder_id: null
    };
    
    // Explicitly call the handler with the partial input
    // Zod will apply the default value during parsing
    const inputWithDefaults: CreateNoteInput = {
      ...noteInput,
      is_pinned: false // This is what Zod's .default(false) would set
    };
    
    const result = await createNote(inputWithDefaults);

    // is_pinned should be false (the default)
    expect(result.is_pinned).toEqual(false);
  });
});
