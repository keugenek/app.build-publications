import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput } from '../schema';
import { getSubjects } from '../handlers/get_subjects';

// Test data
const testSubject1: CreateSubjectInput = {
  name: 'Mathematics',
  description: 'Advanced mathematics topics'
};

const testSubject2: CreateSubjectInput = {
  name: 'Physics',
  description: null
};

const testSubject3: CreateSubjectInput = {
  name: 'Chemistry', 
  description: 'Organic and inorganic chemistry'
};

describe('getSubjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subjects exist', async () => {
    const result = await getSubjects();

    expect(result).toEqual([]);
  });

  it('should return all subjects', async () => {
    // Create test subjects
    await db.insert(subjectsTable).values([
      testSubject1,
      testSubject2,
      testSubject3
    ]).execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    
    // Verify all subjects are returned
    const names = result.map(s => s.name);
    expect(names).toContain('Mathematics');
    expect(names).toContain('Physics');
    expect(names).toContain('Chemistry');
  });

  it('should return subjects with correct fields and types', async () => {
    await db.insert(subjectsTable).values(testSubject1).execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    const subject = result[0];
    
    // Verify field types and values
    expect(typeof subject.id).toBe('number');
    expect(typeof subject.name).toBe('string');
    expect(subject.description).toEqual('Advanced mathematics topics');
    expect(subject.created_at).toBeInstanceOf(Date);
    expect(subject.name).toEqual('Mathematics');
  });

  it('should handle subjects with null descriptions', async () => {
    await db.insert(subjectsTable).values(testSubject2).execute();

    const result = await getSubjects();

    expect(result).toHaveLength(1);
    const subject = result[0];
    
    expect(subject.name).toEqual('Physics');
    expect(subject.description).toBeNull();
    expect(subject.created_at).toBeInstanceOf(Date);
  });

  it('should return subjects ordered by created_at descending (newest first)', async () => {
    // Insert subjects with slight delay to ensure different timestamps
    await db.insert(subjectsTable).values(testSubject1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(subjectsTable).values(testSubject2).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(subjectsTable).values(testSubject3).execute();

    const result = await getSubjects();

    expect(result).toHaveLength(3);
    
    // Verify order: newest first (Chemistry should be first)
    expect(result[0].name).toEqual('Chemistry');
    expect(result[1].name).toEqual('Physics');
    expect(result[2].name).toEqual('Mathematics');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should verify data consistency with direct database query', async () => {
    await db.insert(subjectsTable).values([testSubject1, testSubject2]).execute();

    const handlerResult = await getSubjects();
    const dbResult = await db.select().from(subjectsTable).execute();

    expect(handlerResult).toHaveLength(2);
    expect(dbResult).toHaveLength(2);
    
    // Verify both queries return same data (ignoring order)
    const handlerNames = handlerResult.map(s => s.name).sort();
    const dbNames = dbResult.map(s => s.name).sort();
    
    expect(handlerNames).toEqual(dbNames);
  });
});
