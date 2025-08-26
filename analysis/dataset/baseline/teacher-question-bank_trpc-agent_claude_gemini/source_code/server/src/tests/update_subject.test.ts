import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateSubjectInput } from '../schema';
import { updateSubject } from '../handlers/update_subject';

describe('updateSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a subject name', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject'
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Updated Subject');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a subject description', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      description: 'Updated description'
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Test Subject'); // Should remain unchanged
    expect(result.description).toBe('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject',
      description: 'Updated description'
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Updated Subject');
    expect(result.description).toBe('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      description: null
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Test Subject'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Database Updated Subject'
    };

    await updateSubject(input);

    // Verify the database was updated
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, createdSubject.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toBe('Database Updated Subject');
    expect(subjects[0].description).toBe('Original description');
  });

  it('should return unchanged subject when no fields provided', async () => {
    // Create a subject first
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Test description'
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Test Subject');
    expect(result.description).toBe('Test description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject not found', async () => {
    const input: UpdateSubjectInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Subject'
    };

    await expect(updateSubject(input)).rejects.toThrow(/subject with id 99999 not found/i);
  });

  it('should handle subject with null description', async () => {
    // Create a subject with null description
    const [createdSubject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: null
      })
      .returning()
      .execute();

    const input: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject'
    };

    const result = await updateSubject(input);

    expect(result.id).toBe(createdSubject.id);
    expect(result.name).toBe('Updated Subject');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
