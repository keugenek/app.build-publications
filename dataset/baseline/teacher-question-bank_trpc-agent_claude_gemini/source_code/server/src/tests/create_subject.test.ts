import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { createSubject } from '../handlers/create_subject';
import { eq } from 'drizzle-orm';

// Test input with required fields
const testInput: CreateSubjectInput = {
  name: 'Mathematics',
  description: 'A comprehensive mathematics course'
};

describe('createSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a subject with description', async () => {
    const result = await createSubject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Mathematics');
    expect(result.description).toEqual('A comprehensive mathematics course');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a subject with null description', async () => {
    const inputWithNullDescription: CreateSubjectInput = {
      name: 'Physics',
      description: null
    };

    const result = await createSubject(inputWithNullDescription);

    expect(result.name).toEqual('Physics');
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
    expect(subjects[0].description).toEqual('A comprehensive mathematics course');
    expect(subjects[0].id).toEqual(result.id);
    expect(subjects[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple subjects with unique IDs', async () => {
    const subject1 = await createSubject({
      name: 'English',
      description: 'English Language and Literature'
    });

    const subject2 = await createSubject({
      name: 'History',
      description: 'World History'
    });

    expect(subject1.id).not.toEqual(subject2.id);
    expect(subject1.name).toEqual('English');
    expect(subject2.name).toEqual('History');

    // Verify both subjects exist in database
    const allSubjects = await db.select()
      .from(subjectsTable)
      .execute();

    expect(allSubjects).toHaveLength(2);
    
    const subject1InDb = allSubjects.find(s => s.id === subject1.id);
    const subject2InDb = allSubjects.find(s => s.id === subject2.id);
    
    expect(subject1InDb).toBeDefined();
    expect(subject2InDb).toBeDefined();
    expect(subject1InDb?.name).toEqual('English');
    expect(subject2InDb?.name).toEqual('History');
  });

  it('should handle empty string description correctly', async () => {
    const inputWithEmptyDescription: CreateSubjectInput = {
      name: 'Chemistry',
      description: ''
    };

    const result = await createSubject(inputWithEmptyDescription);

    expect(result.name).toEqual('Chemistry');
    expect(result.description).toEqual('');
    expect(result.id).toBeDefined();
  });

  it('should create subjects with different names successfully', async () => {
    const subjects = [
      { name: 'Biology', description: 'Life sciences' },
      { name: 'Computer Science', description: 'Programming and algorithms' },
      { name: 'Art', description: null }
    ];

    const results = await Promise.all(
      subjects.map(subject => createSubject(subject))
    );

    expect(results).toHaveLength(3);
    
    // Verify all have unique IDs and correct names
    const ids = results.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3); // All IDs should be unique

    expect(results[0].name).toEqual('Biology');
    expect(results[1].name).toEqual('Computer Science');
    expect(results[2].name).toEqual('Art');
    expect(results[2].description).toBeNull();
  });
});
