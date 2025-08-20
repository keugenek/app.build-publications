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
  });

  it('should return all topics when topics exist', async () => {
    // Create prerequisite subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topics
    const topic1 = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subjectId })
      .returning()
      .execute();

    const topic2 = await db.insert(topicsTable)
      .values({ name: 'Geometry', subject_id: subjectId })
      .returning()
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(2);
    
    // Check first topic
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toEqual('Algebra');
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second topic
    expect(result[1].id).toBeDefined();
    expect(result[1].name).toEqual('Geometry');
    expect(result[1].subject_id).toEqual(subjectId);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return topics from multiple subjects', async () => {
    // Create multiple subjects
    const mathSubject = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();

    const scienceSubject = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning()
      .execute();

    // Create topics for each subject
    await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: mathSubject[0].id })
      .execute();

    await db.insert(topicsTable)
      .values({ name: 'Biology', subject_id: scienceSubject[0].id })
      .execute();

    await db.insert(topicsTable)
      .values({ name: 'Chemistry', subject_id: scienceSubject[0].id })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(3);
    
    // Verify topics from different subjects are included
    const topicNames = result.map(topic => topic.name);
    expect(topicNames).toContain('Algebra');
    expect(topicNames).toContain('Biology');
    expect(topicNames).toContain('Chemistry');

    // Verify subject IDs are correct
    const algebraTopic = result.find(topic => topic.name === 'Algebra');
    expect(algebraTopic?.subject_id).toEqual(mathSubject[0].id);

    const biologyTopic = result.find(topic => topic.name === 'Biology');
    expect(biologyTopic?.subject_id).toEqual(scienceSubject[0].id);
  });

  it('should return topics with correct data types', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'History' })
      .returning()
      .execute();

    // Create a test topic
    await db.insert(topicsTable)
      .values({ name: 'World War II', subject_id: subjectResult[0].id })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(1);
    
    const topic = result[0];
    expect(typeof topic.id).toBe('number');
    expect(typeof topic.name).toBe('string');
    expect(typeof topic.subject_id).toBe('number');
    expect(topic.created_at).toBeInstanceOf(Date);
  });
});
