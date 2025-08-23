import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, notesTable } from '../db/schema';
import { type CreateUserInput, type CreateFolderInput, type CreateNoteInput } from '../schema';
import { createNote } from '../handlers/create_note';
import { eq } from 'drizzle-orm';

describe('createNote', () => {
  let userId: number;
  let folderId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    userId = userResult[0].id;
    
    // Create a folder for the user
    const folderResult = await db.insert(foldersTable)
      .values({ 
        name: 'Test Folder',
        user_id: userId 
      })
      .returning()
      .execute();
    
    folderId = folderResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a note with folder', async () => {
    const input: CreateNoteInput = {
      title: 'Test Note With Folder',
      content: 'This is a test note with a folder',
      user_id: userId,
      folder_id: folderId
    };

    const result = await createNote(input);

    // Basic field validation
    expect(result.title).toEqual('Test Note With Folder');
    expect(result.content).toEqual('This is a test note with a folder');
    expect(result.user_id).toEqual(userId);
    expect(result.folder_id).toEqual(folderId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a note without folder', async () => {
    const input: CreateNoteInput = {
      title: 'Test Note Without Folder',
      content: 'This is a test note without a folder',
      user_id: userId
    };

    const result = await createNote(input);

    // Basic field validation
    expect(result.title).toEqual('Test Note Without Folder');
    expect(result.content).toEqual('This is a test note without a folder');
    expect(result.user_id).toEqual(userId);
    expect(result.folder_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save note to database', async () => {
    const input: CreateNoteInput = {
      title: 'Test Note For DB Test',
      content: 'This is a test note for database testing',
      user_id: userId,
      folder_id: folderId
    };

    const result = await createNote(input);

    // Query using proper drizzle syntax
    const notes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].title).toEqual('Test Note For DB Test');
    expect(notes[0].content).toEqual('This is a test note for database testing');
    expect(notes[0].user_id).toEqual(userId);
    expect(notes[0].folder_id).toEqual(folderId);
    expect(notes[0].created_at).toBeInstanceOf(Date);
    expect(notes[0].updated_at).toBeInstanceOf(Date);
  });
});
