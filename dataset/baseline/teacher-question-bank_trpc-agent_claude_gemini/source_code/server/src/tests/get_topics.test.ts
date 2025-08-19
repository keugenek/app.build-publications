import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { getTopics } from '../handlers/get_topics';

describe('getTopics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no topics exist', async () => {
    const result = await getTopics();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all topics from database', async () => {
    // Create prerequisite subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topics
    await db.insert(topicsTable)
      .values([
        {
          name: 'Algebra',
          description: 'Basic algebra concepts',
          subject_id: subjectId
        },
        {
          name: 'Geometry',
          description: 'Geometric shapes and formulas',
          subject_id: subjectId
        }
      ])
      .execute();

    const result = await getTopics();

    // Verify all topics are returned
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Algebra');
    expect(result[0].description).toEqual('Basic algebra concepts');
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Geometry');
    expect(result[1].description).toEqual('Geometric shapes and formulas');
    expect(result[1].subject_id).toEqual(subjectId);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return topics ordered by creation date', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create topics with small delay to ensure different timestamps
    await db.insert(topicsTable)
      .values({
        name: 'First Topic',
        description: 'Created first',
        subject_id: subjectId
      })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(topicsTable)
      .values({
        name: 'Second Topic',
        description: 'Created second',
        subject_id: subjectId
      })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Topic');
    expect(result[1].name).toEqual('Second Topic');
    
    // Verify ordering by creation date
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle topics from multiple subjects', async () => {
    // Create multiple subjects
    const mathSubject = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const scienceSubject = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();

    // Create topics for different subjects
    await db.insert(topicsTable)
      .values([
        {
          name: 'Calculus',
          description: 'Advanced calculus',
          subject_id: mathSubject[0].id
        },
        {
          name: 'Physics',
          description: 'Basic physics',
          subject_id: scienceSubject[0].id
        }
      ])
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(2);
    
    // Verify topics from different subjects are returned
    const calculusTopic = result.find(topic => topic.name === 'Calculus');
    const physicsTopic = result.find(topic => topic.name === 'Physics');
    
    expect(calculusTopic).toBeDefined();
    expect(calculusTopic?.subject_id).toEqual(mathSubject[0].id);
    
    expect(physicsTopic).toBeDefined();
    expect(physicsTopic?.subject_id).toEqual(scienceSubject[0].id);
  });

  it('should handle topics with null descriptions', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A test subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create topic with null description
    await db.insert(topicsTable)
      .values({
        name: 'Topic Without Description',
        description: null,
        subject_id: subjectId
      })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Topic Without Description');
    expect(result[0].description).toBeNull();
    expect(result[0].subject_id).toEqual(subjectId);
  });
});
