import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { getTopics } from '../handlers/get_topics';

// Test data
const testSubject1 = {
  name: 'Mathematics',
  description: 'Mathematics subject'
};

const testSubject2 = {
  name: 'Science',
  description: 'Science subject'
};

const testTopic1 = {
  name: 'Algebra',
  description: 'Algebra topic',
  subject_id: 0 // Will be set after subject creation
};

const testTopic2 = {
  name: 'Geometry',
  description: 'Geometry topic',
  subject_id: 0 // Will be set after subject creation
};

const testTopic3 = {
  name: 'Physics',
  description: 'Physics topic',
  subject_id: 0 // Will be set after subject creation
};

describe('getTopics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all topics when no subjectId is provided', async () => {
    // Create test subjects first
    const subjects = await db.insert(subjectsTable)
      .values([testSubject1, testSubject2])
      .returning()
      .execute();

    // Create test topics for different subjects
    await db.insert(topicsTable)
      .values([
        { ...testTopic1, subject_id: subjects[0].id },
        { ...testTopic2, subject_id: subjects[0].id },
        { ...testTopic3, subject_id: subjects[1].id }
      ])
      .execute();

    const result = await getTopics();

    // Should return all topics
    expect(result).toHaveLength(3);
    
    // Verify topic data
    const topicNames = result.map(topic => topic.name).sort();
    expect(topicNames).toEqual(['Algebra', 'Geometry', 'Physics']);

    // Verify all topics have required fields
    result.forEach(topic => {
      expect(topic.id).toBeDefined();
      expect(topic.name).toBeDefined();
      expect(topic.subject_id).toBeDefined();
      expect(topic.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return topics filtered by subjectId when provided', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([testSubject1, testSubject2])
      .returning()
      .execute();

    // Create test topics for different subjects
    await db.insert(topicsTable)
      .values([
        { ...testTopic1, subject_id: subjects[0].id },
        { ...testTopic2, subject_id: subjects[0].id },
        { ...testTopic3, subject_id: subjects[1].id }
      ])
      .execute();

    // Get topics for first subject only
    const result = await getTopics(subjects[0].id);

    // Should return only topics for the specified subject
    expect(result).toHaveLength(2);
    
    // Verify all returned topics belong to the correct subject
    result.forEach(topic => {
      expect(topic.subject_id).toEqual(subjects[0].id);
    });

    // Verify topic names
    const topicNames = result.map(topic => topic.name).sort();
    expect(topicNames).toEqual(['Algebra', 'Geometry']);
  });

  it('should return empty array when no topics exist', async () => {
    const result = await getTopics();
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when filtering by non-existent subjectId', async () => {
    // Create test subject and topics
    const subject = await db.insert(subjectsTable)
      .values(testSubject1)
      .returning()
      .execute();

    await db.insert(topicsTable)
      .values({ ...testTopic1, subject_id: subject[0].id })
      .execute();

    // Filter by non-existent subject ID
    const result = await getTopics(999999);
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle subject with no topics', async () => {
    // Create subject but no topics
    const subject = await db.insert(subjectsTable)
      .values(testSubject1)
      .returning()
      .execute();

    const result = await getTopics(subject[0].id);
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return topics with correct data types', async () => {
    // Create test subject
    const subject = await db.insert(subjectsTable)
      .values(testSubject1)
      .returning()
      .execute();

    // Create test topic
    await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Test Description',
        subject_id: subject[0].id
      })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(1);
    
    const topic = result[0];
    expect(typeof topic.id).toBe('number');
    expect(typeof topic.name).toBe('string');
    expect(typeof topic.subject_id).toBe('number');
    expect(topic.created_at).toBeInstanceOf(Date);
    expect(topic.description).toBe('Test Description');

    // Verify specific values
    expect(topic.name).toBe('Test Topic');
    expect(topic.description).toBe('Test Description');
    expect(topic.subject_id).toBe(subject[0].id);
  });

  it('should handle null description correctly', async () => {
    // Create test subject
    const subject = await db.insert(subjectsTable)
      .values(testSubject1)
      .returning()
      .execute();

    // Create topic with null description
    await db.insert(topicsTable)
      .values({
        name: 'Topic with null description',
        description: null,
        subject_id: subject[0].id
      })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
  });
});
