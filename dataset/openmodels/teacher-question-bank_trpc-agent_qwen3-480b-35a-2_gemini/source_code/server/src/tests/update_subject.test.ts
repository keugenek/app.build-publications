import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput } from '../schema';
import { updateSubject } from '../handlers/update_subject';
import { eq } from 'drizzle-orm';

// Test inputs
const testSubjectInput = {
  name: 'Test Subject'
};

const updateSubjectInput: UpdateSubjectInput = {
  id: 1,
  name: 'Updated Subject Name'
};

describe('updateSubject', () => {
  beforeEach(async () => {
    await createDB();
    // Create a subject to update
    await db.insert(subjectsTable).values(testSubjectInput).execute();
  });
  
  afterEach(resetDB);

  it('should update a subject name', async () => {
    const result = await updateSubject(updateSubjectInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Subject Name');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated subject to database', async () => {
    const result = await updateSubject(updateSubjectInput);

    // Query the database to verify the update was persisted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Updated Subject Name');
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent subject', async () => {
    const invalidInput: UpdateSubjectInput = {
      id: 999,
      name: 'Non-existent Subject'
    };

    await expect(updateSubject(invalidInput)).rejects.toThrow(/not found/);
  });

  it('should partially update a subject when only some fields are provided', async () => {
    const partialUpdateInput: UpdateSubjectInput = {
      id: 1,
      name: 'Partially Updated Subject'
    };

    const result = await updateSubject(partialUpdateInput);

    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Partially Updated Subject');
  });
});
