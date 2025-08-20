import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { getSubjects } from '../handlers/get_subjects';

describe('getSubjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subjects exist', async () => {
    const result = await getSubjects();
    expect(result).toEqual([]);
  });

  it('should return all subjects when they exist', async () => {
    // Create test subjects
    const testSubjects = [
      { name: 'Mathematics', description: 'Math subject' },
      { name: 'Science', description: 'Science subject' },
      { name: 'History', description: null }
    ];

    // Insert test subjects
    for (const subject of testSubjects) {
      await db.insert(subjectsTable)
        .values(subject)
        .execute();
    }

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    
    // Check first subject
    expect(result[0].name).toEqual('Mathematics');
    expect(result[0].description).toEqual('Math subject');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second subject
    expect(result[1].name).toEqual('Science');
    expect(result[1].description).toEqual('Science subject');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Check third subject with null description
    expect(result[2].name).toEqual('History');
    expect(result[2].description).toBeNull();
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return subjects in creation order', async () => {
    // Create subjects with slight delay to ensure different timestamps
    await db.insert(subjectsTable)
      .values({ name: 'First Subject', description: 'First' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1)); // Small delay

    await db.insert(subjectsTable)
      .values({ name: 'Second Subject', description: 'Second' })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Subject');
    expect(result[1].name).toEqual('Second Subject');
    
    // Verify creation timestamps are in correct order
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle subjects with various description values', async () => {
    const testCases = [
      { name: 'Subject 1', description: 'Normal description' },
      { name: 'Subject 2', description: '' },
      { name: 'Subject 3', description: null },
      { name: 'Subject 4', description: 'Very long description that spans multiple words and contains special characters like !@#$%^&*()' }
    ];

    // Insert all test subjects
    for (const subject of testCases) {
      await db.insert(subjectsTable)
        .values(subject)
        .execute();
    }

    const result = await getSubjects();

    expect(result).toHaveLength(4);
    
    // Verify each subject's description is handled correctly
    expect(result[0].description).toEqual('Normal description');
    expect(result[1].description).toEqual('');
    expect(result[2].description).toBeNull();
    expect(result[3].description).toEqual('Very long description that spans multiple words and contains special characters like !@#$%^&*()');
  });

  it('should return subjects with all required fields', async () => {
    await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Test description' })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    const subject = result[0];

    // Verify all required fields are present and have correct types
    expect(typeof subject.id).toEqual('number');
    expect(typeof subject.name).toEqual('string');
    expect(subject.description === null || typeof subject.description === 'string').toBe(true);
    expect(subject.created_at).toBeInstanceOf(Date);

    // Verify field values
    expect(subject.name).toEqual('Test Subject');
    expect(subject.description).toEqual('Test description');
    expect(subject.id).toBeGreaterThan(0);
  });
});
