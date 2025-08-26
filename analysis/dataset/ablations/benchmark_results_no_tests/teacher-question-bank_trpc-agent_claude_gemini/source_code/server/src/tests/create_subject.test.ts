import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { createSubject } from '../handlers/create_subject';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateSubjectInput = {
  name: 'Mathematics',
  description: 'Mathematics subject covering algebra, geometry, and calculus'
};

const testInputWithoutDescription: CreateSubjectInput = {
  name: 'Physics'
};

const testInputWithNullDescription: CreateSubjectInput = {
  name: 'Chemistry',
  description: null
};

describe('createSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a subject with description', async () => {
    const result = await createSubject(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Mathematics');
    expect(result.description).toEqual('Mathematics subject covering algebra, geometry, and calculus');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a subject without description', async () => {
    const result = await createSubject(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Physics');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a subject with null description', async () => {
    const result = await createSubject(testInputWithNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Chemistry');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save subject to database', async () => {
    const result = await createSubject(testInputWithDescription);

    // Query using proper drizzle syntax
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Mathematics');
    expect(subjects[0].description).toEqual('Mathematics subject covering algebra, geometry, and calculus');
    expect(subjects[0].created_at).toBeInstanceOf(Date);
    expect(subjects[0].id).toEqual(result.id);
  });

  it('should save subject without description to database', async () => {
    const result = await createSubject(testInputWithoutDescription);

    // Query using proper drizzle syntax
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects).toHaveLength(1);
    expect(subjects[0].name).toEqual('Physics');
    expect(subjects[0].description).toBeNull();
    expect(subjects[0].created_at).toBeInstanceOf(Date);
    expect(subjects[0].id).toEqual(result.id);
  });

  it('should create multiple subjects with unique IDs', async () => {
    const result1 = await createSubject(testInputWithDescription);
    const result2 = await createSubject(testInputWithoutDescription);
    const result3 = await createSubject(testInputWithNullDescription);

    // Verify unique IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
    expect(result1.id).not.toEqual(result3.id);

    // Verify all subjects are in database
    const allSubjects = await db.select()
      .from(subjectsTable)
      .execute();

    expect(allSubjects).toHaveLength(3);
    
    const subjectNames = allSubjects.map(s => s.name).sort();
    expect(subjectNames).toEqual(['Chemistry', 'Mathematics', 'Physics']);
  });

  it('should handle created_at timestamp correctly', async () => {
    const beforeCreation = new Date();
    const result = await createSubject(testInputWithDescription);
    const afterCreation = new Date();

    // Verify created_at is within expected range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Verify the timestamp is saved correctly in database
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects[0].created_at).toBeInstanceOf(Date);
    expect(subjects[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});
