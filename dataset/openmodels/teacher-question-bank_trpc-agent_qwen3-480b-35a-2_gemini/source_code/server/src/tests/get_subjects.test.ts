import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { getSubjects } from '../handlers/get_subjects';

describe('getSubjects', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test subjects
    await db.insert(subjectsTable).values([
      { name: 'Mathematics' },
      { name: 'Science' },
      { name: 'History' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all subjects from the database', async () => {
    const subjects = await getSubjects();
    
    expect(subjects).toHaveLength(3);
    
    // Check that all expected subjects are returned
    const subjectNames = subjects.map(s => s.name);
    expect(subjectNames).toContain('Mathematics');
    expect(subjectNames).toContain('Science');
    expect(subjectNames).toContain('History');
    
    // Check that each subject has the expected properties
    subjects.forEach(subject => {
      expect(subject).toHaveProperty('id');
      expect(subject).toHaveProperty('name');
      expect(subject).toHaveProperty('created_at');
      expect(typeof subject.id).toBe('number');
      expect(typeof subject.name).toBe('string');
      expect(subject.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return an empty array when no subjects exist', async () => {
    // Clear all subjects
    await db.delete(subjectsTable).execute();
    
    const subjects = await getSubjects();
    
    expect(subjects).toHaveLength(0);
    expect(subjects).toEqual([]);
  });

  it('should preserve the order of subjects from the database', async () => {
    // Get subjects directly from DB to compare order
    const dbSubjects = await db.select().from(subjectsTable).execute();
    const handlerSubjects = await getSubjects();
    
    // Check that the order is preserved
    expect(handlerSubjects[0].name).toBe(dbSubjects[0].name);
    expect(handlerSubjects[1].name).toBe(dbSubjects[1].name);
    expect(handlerSubjects[2].name).toBe(dbSubjects[2].name);
  });
});
