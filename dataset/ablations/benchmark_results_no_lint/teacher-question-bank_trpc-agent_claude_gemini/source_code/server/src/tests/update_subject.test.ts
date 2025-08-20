import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput } from '../schema';
import { updateSubject } from '../handlers/update_subject';
import { eq } from 'drizzle-orm';

describe('updateSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a subject name', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject'
    };

    const result = await updateSubject(updateInput);

    // Verify the returned result
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Updated Subject');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a subject description', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      description: 'Updated description'
    };

    const result = await updateSubject(updateInput);

    // Verify the returned result
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Test Subject'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject Name',
      description: 'Updated description'
    };

    const result = await updateSubject(updateInput);

    // Verify the returned result
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Updated Subject Name');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      description: null
    };

    const result = await updateSubject(updateInput);

    // Verify the returned result
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Test Subject'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Database Updated Subject',
      description: 'Database updated description'
    };

    await updateSubject(updateInput);

    // Query database to verify the changes were persisted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, createdSubject.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Database Updated Subject');
    expect(subjects[0].description).toEqual('Database updated description');
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent subject', async () => {
    const updateInput: UpdateSubjectInput = {
      id: 999, // Non-existent ID
      name: 'Updated Subject'
    };

    await expect(updateSubject(updateInput)).rejects.toThrow(/Subject with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    // Update only the name
    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Only Name Updated'
    };

    const result = await updateSubject(updateInput);

    // Verify only name was updated, description remains the same
    expect(result.name).toEqual('Only Name Updated');
    expect(result.description).toEqual('Original description');

    // Verify in database as well
    const dbSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, createdSubject.id))
      .execute();

    expect(dbSubjects[0].name).toEqual('Only Name Updated');
    expect(dbSubjects[0].description).toEqual('Original description');
  });

  it('should preserve created_at timestamp', async () => {
    // Create a test subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const originalCreatedAt = createdSubject.created_at;

    // Wait a small amount to ensure timestamp would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject'
    };

    const result = await updateSubject(updateInput);

    // Verify created_at was not modified
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
