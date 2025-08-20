import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { createSubject } from '../handlers/create_subject';
import { eq } from 'drizzle-orm';

// Simple test input with required fields
const testInput: CreateSubjectInput = {
  name: 'Mathematics',
  description: 'Basic mathematics concepts and problems'
};

describe('createSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a subject with all fields', async () => {
    const result = await createSubject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Mathematics');
    expect(result.description).toEqual('Basic mathematics concepts and problems');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a subject with null description', async () => {
    const inputWithNullDescription: CreateSubjectInput = {
      name: 'History',
      description: null
    };

    const result = await createSubject(inputWithNullDescription);

    expect(result.name).toEqual('History');
    expect(result.description).toBeNull();
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
    expect(subjects[0].description).toEqual('Basic mathematics concepts and problems');
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple subjects with unique IDs', async () => {
    const input1: CreateSubjectInput = {
      name: 'Physics',
      description: 'Study of matter and energy'
    };

    const input2: CreateSubjectInput = {
      name: 'Chemistry',
      description: 'Study of chemical reactions'
    };

    const result1 = await createSubject(input1);
    const result2 = await createSubject(input2);

    // Check that IDs are different
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Physics');
    expect(result2.name).toEqual('Chemistry');

    // Verify both are saved in database
    const allSubjects = await db.select()
      .from(subjectsTable)
      .execute();

    expect(allSubjects).toHaveLength(2);
    const names = allSubjects.map(subject => subject.name);
    expect(names).toContain('Physics');
    expect(names).toContain('Chemistry');
  });

  it('should handle subjects with same name', async () => {
    const input1: CreateSubjectInput = {
      name: 'Biology',
      description: 'Life sciences - plants'
    };

    const input2: CreateSubjectInput = {
      name: 'Biology',
      description: 'Life sciences - animals'
    };

    const result1 = await createSubject(input1);
    const result2 = await createSubject(input2);

    // Both should be created successfully with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Biology');
    expect(result2.name).toEqual('Biology');
    expect(result1.description).toEqual('Life sciences - plants');
    expect(result2.description).toEqual('Life sciences - animals');
  });

  it('should preserve creation timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createSubject(testInput);
    const afterCreation = new Date();

    // Creation timestamp should be between before and after
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });
});
