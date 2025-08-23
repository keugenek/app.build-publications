import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { getSubjects } from '../handlers/get_subjects';
import { eq } from 'drizzle-orm';

describe('getSubjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no subjects exist', async () => {
    const result = await getSubjects();
    expect(result).toEqual([]);
  });

  it('should return all subjects from the database', async () => {
    // Insert test data
    const testSubjects = [
      { name: 'Mathematics' },
      { name: 'Science' },
      { name: 'History' }
    ];

    await db.insert(subjectsTable).values(testSubjects).execute();

    // Test the handler
    const result = await getSubjects();

    // Verify results
    expect(result).toHaveLength(3);
    
    const subjectNames = result.map(subject => subject.name).sort();
    expect(subjectNames).toEqual(['History', 'Mathematics', 'Science']);
    
    // Verify each subject has proper structure
    result.forEach(subject => {
      expect(subject).toHaveProperty('id');
      expect(subject).toHaveProperty('name');
      expect(subject).toHaveProperty('created_at');
      expect(typeof subject.id).toBe('number');
      expect(typeof subject.name).toBe('string');
      expect(subject.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return subjects in the correct format', async () => {
    // Insert a test subject
    const [{ id }] = await db.insert(subjectsTable)
      .values({ name: 'Physics' })
      .returning({ id: subjectsTable.id })
      .execute();

    // Get subjects through handler
    const result = await getSubjects();
    
    expect(result).toHaveLength(1);
    const subject = result[0];
    
    // Verify the structure matches our schema
    expect(subject.id).toBe(id);
    expect(subject.name).toBe('Physics');
    expect(subject.created_at).toBeInstanceOf(Date);
  });
});
