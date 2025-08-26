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
    // Create a subject first
    const created = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject'
      })
      .returning()
      .execute();

    const createdSubject = created[0];

    // Update the subject
    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject Name'
    };

    const result = await updateSubject(updateInput);

    // Verify the result
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Updated Subject Name');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdSubject.created_at);
  });

  it('should save updated subject to database', async () => {
    // Create a subject first
    const created = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject'
      })
      .returning()
      .execute();

    const createdSubject = created[0];

    // Update the subject
    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: 'Updated Subject Name'
    };

    await updateSubject(updateInput);

    // Query the database directly to verify the update
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, createdSubject.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Updated Subject Name');
    expect(subjects[0].id).toEqual(createdSubject.id);
    expect(subjects[0].created_at).toEqual(createdSubject.created_at);
  });

  it('should return existing subject when no fields to update', async () => {
    // Create a subject first
    const created = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject'
      })
      .returning()
      .execute();

    const createdSubject = created[0];

    // Update with empty optional fields
    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id
      // No name provided - should return existing subject
    };

    const result = await updateSubject(updateInput);

    // Should return the original subject unchanged
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('Original Subject');
    expect(result.created_at).toEqual(createdSubject.created_at);
  });

  it('should handle partial updates correctly', async () => {
    // Create multiple subjects
    const created1 = await db.insert(subjectsTable)
      .values({ name: 'Subject 1' })
      .returning()
      .execute();

    const created2 = await db.insert(subjectsTable)
      .values({ name: 'Subject 2' })
      .returning()
      .execute();

    const subject1 = created1[0];
    const subject2 = created2[0];

    // Update only the first subject
    const updateInput: UpdateSubjectInput = {
      id: subject1.id,
      name: 'Updated Subject 1'
    };

    await updateSubject(updateInput);

    // Verify first subject was updated
    const updatedSubject1 = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject1.id))
      .execute();

    expect(updatedSubject1[0].name).toEqual('Updated Subject 1');

    // Verify second subject was not affected
    const unchangedSubject2 = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject2.id))
      .execute();

    expect(unchangedSubject2[0].name).toEqual('Subject 2');
  });

  it('should throw error when subject not found', async () => {
    const updateInput: UpdateSubjectInput = {
      id: 999, // Non-existent ID
      name: 'Updated Name'
    };

    expect(updateSubject(updateInput)).rejects.toThrow(/subject with id 999 not found/i);
  });

  it('should throw error when subject not found with no update fields', async () => {
    const updateInput: UpdateSubjectInput = {
      id: 999 // Non-existent ID, no name provided
    };

    expect(updateSubject(updateInput)).rejects.toThrow(/subject with id 999 not found/i);
  });

  it('should handle empty string name correctly', async () => {
    // Create a subject first
    const created = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject'
      })
      .returning()
      .execute();

    const createdSubject = created[0];

    // This should be caught by Zod validation, but if it gets through:
    const updateInput: UpdateSubjectInput = {
      id: createdSubject.id,
      name: ''
    };

    const result = await updateSubject(updateInput);

    // The handler should still process it (Zod validation happens at API level)
    expect(result.id).toEqual(createdSubject.id);
    expect(result.name).toEqual('');
  });
});
