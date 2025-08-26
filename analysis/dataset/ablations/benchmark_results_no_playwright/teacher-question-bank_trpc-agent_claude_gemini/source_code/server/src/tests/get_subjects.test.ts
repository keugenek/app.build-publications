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

  it('should return all subjects from database', async () => {
    // Create test subjects
    await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'History' }
      ])
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Mathematics');
    expect(result[1].name).toEqual('Science');
    expect(result[2].name).toEqual('History');

    // Verify all subjects have required fields
    result.forEach(subject => {
      expect(subject.id).toBeDefined();
      expect(typeof subject.id).toBe('number');
      expect(subject.name).toBeDefined();
      expect(typeof subject.name).toBe('string');
      expect(subject.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return subjects in order of creation', async () => {
    // Create subjects with slight delay to ensure different timestamps
    await db.insert(subjectsTable)
      .values({ name: 'First Subject' })
      .execute();
    
    await db.insert(subjectsTable)
      .values({ name: 'Second Subject' })
      .execute();
    
    await db.insert(subjectsTable)
      .values({ name: 'Third Subject' })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Subject');
    expect(result[1].name).toEqual('Second Subject');
    expect(result[2].name).toEqual('Third Subject');

    // Verify timestamps are in ascending order
    expect(result[0].created_at <= result[1].created_at).toBe(true);
    expect(result[1].created_at <= result[2].created_at).toBe(true);
  });

  it('should handle single subject correctly', async () => {
    await db.insert(subjectsTable)
      .values({ name: 'Physics' })
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Physics');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return subjects with special characters in names', async () => {
    await db.insert(subjectsTable)
      .values([
        { name: 'Art & Design' },
        { name: 'Computer Science: Programming' },
        { name: 'English (Literature)' }
      ])
      .execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    
    const names = result.map(subject => subject.name);
    expect(names).toContain('Art & Design');
    expect(names).toContain('Computer Science: Programming');
    expect(names).toContain('English (Literature)');
  });
});
