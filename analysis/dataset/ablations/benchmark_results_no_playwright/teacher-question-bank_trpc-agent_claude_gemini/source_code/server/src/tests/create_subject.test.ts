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
    expect(typeof result.id).toBe('number');
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
    const subject3 = await createSubject({ name: 'History' });

    // Verify each subject has unique ID
    expect(subject1.id).not.toEqual(subject2.id);
    expect(subject2.id).not.toEqual(subject3.id);
    expect(subject1.id).not.toEqual(subject3.id);

    // Verify all subjects are saved
    const allSubjects = await db.select()
      .from(subjectsTable)
      .execute();

    expect(allSubjects).toHaveLength(3);
    const names = allSubjects.map(s => s.name).sort();
    expect(names).toEqual(['History', 'Mathematics', 'Science']);
  });

  it('should handle long subject names', async () => {
    const longName = 'A'.repeat(100); // 100 character name
    const input = { name: longName };

    const result = await createSubject(input);

    expect(result.name).toEqual(longName);
    expect(result.name.length).toEqual(100);

    // Verify it's saved correctly
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects[0].name).toEqual(longName);
  });

  it('should handle special characters in subject names', async () => {
    const specialName = 'Math & Science - Advanced (2024)';
    const input = { name: specialName };

    const result = await createSubject(input);

    expect(result.name).toEqual(specialName);

    // Verify it's saved correctly
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, result.id))
      .execute();

    expect(subjects[0].name).toEqual(specialName);
  });

  it('should set created_at timestamp correctly', async () => {
    const beforeCreation = new Date();
    const result = await createSubject(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
