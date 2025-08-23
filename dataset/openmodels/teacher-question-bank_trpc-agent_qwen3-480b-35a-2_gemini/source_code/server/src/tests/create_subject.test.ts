import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { createSubject } from '../handlers/create_subject';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateSubjectInput = {
  name: 'Mathematics'
};

describe('createSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a subject', async () => {
    const result = await createSubject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Mathematics');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save subject to database', async () => {
    const result = await createSubject(testInput);

    // Query using proper drizzle syntax
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Mathematics');
    expect(subjects[0].id).toEqual(result.id);
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple subjects with different names', async () => {
    const subject1 = await createSubject({ name: 'Mathematics' });
    const subject2 = await createSubject({ name: 'Science' });
    
    expect(subject1.name).toEqual('Mathematics');
    expect(subject2.name).toEqual('Science');
    expect(subject1.id).not.toEqual(subject2.id);
  });
});
