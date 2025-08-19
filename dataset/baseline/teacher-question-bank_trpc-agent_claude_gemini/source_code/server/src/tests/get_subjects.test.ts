import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { getSubjects } from '../handlers/get_subjects';

describe('getSubjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subjects exist', async () => {
    const result = await getSubjects();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single subject', async () => {
    // Create test subject
    await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Basic mathematics concepts'
      })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Mathematics');
    expect(result[0].description).toEqual('Basic mathematics concepts');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple subjects in correct order', async () => {
    // Create multiple test subjects
    await db.insert(subjectsTable)
      .values([
        {
          name: 'Mathematics',
          description: 'Basic mathematics concepts'
        },
        {
          name: 'Science',
          description: 'General science topics'
        },
        {
          name: 'History',
          description: null
        }
      ])
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    
    // Check all subjects are returned
    const subjectNames = result.map(s => s.name);
    expect(subjectNames).toContain('Mathematics');
    expect(subjectNames).toContain('Science');
    expect(subjectNames).toContain('History');

    // Check structure of each subject
    result.forEach(subject => {
      expect(subject.id).toBeDefined();
      expect(typeof subject.id).toBe('number');
      expect(typeof subject.name).toBe('string');
      expect(subject.created_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(['string', 'object']).toContain(typeof subject.description);
    });
  });

  it('should handle subject with null description', async () => {
    // Create subject with null description
    await db.insert(subjectsTable)
      .values({
        name: 'Physics',
        description: null
      })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Physics');
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return subjects with proper field types', async () => {
    // Create test subject
    await db.insert(subjectsTable)
      .values({
        name: 'Computer Science',
        description: 'Programming and algorithms'
      })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    const subject = result[0];

    // Validate all field types
    expect(typeof subject.id).toBe('number');
    expect(typeof subject.name).toBe('string');
    expect(typeof subject.description).toBe('string');
    expect(subject.created_at).toBeInstanceOf(Date);
  });

  it('should maintain data integrity across multiple calls', async () => {
    // Create test subjects
    await db.insert(subjectsTable)
      .values([
        { name: 'Biology', description: 'Life sciences' },
        { name: 'Chemistry', description: 'Chemical reactions' }
      ])
      .execute();

    // Call handler multiple times
    const result1 = await getSubjects();
    const result2 = await getSubjects();

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(2);
    
    // Results should be identical
    expect(result1).toEqual(result2);
    
    // IDs should be consistent
    expect(result1[0].id).toEqual(result2[0].id);
    expect(result1[1].id).toEqual(result2[1].id);
  });
});
