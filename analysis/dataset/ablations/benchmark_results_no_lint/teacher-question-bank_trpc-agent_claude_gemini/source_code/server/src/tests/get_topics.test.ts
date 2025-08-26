import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { getTopics, getTopicsBySubject } from '../handlers/get_topics';

describe('getTopics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no topics exist', async () => {
    const result = await getTopics();
    expect(result).toEqual([]);
  });

  it('should return all topics', async () => {
    // Create test subject first
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
          description: 'Algebraic concepts',
          subject_id: subjectId
        },
        {
          name: 'Geometry',
          description: 'Geometric shapes',
          subject_id: subjectId
        }
      ])
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Algebra');
    expect(result[0].description).toEqual('Algebraic concepts');
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Geometry');
    expect(result[1].description).toEqual('Geometric shapes');
    expect(result[1].subject_id).toEqual(subjectId);
  });

  it('should return topics with nullable descriptions', async () => {
    // Create test subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    // Create topic with null description
    await db.insert(topicsTable)
      .values({
        name: 'Physics',
        description: null,
        subject_id: subjectId
      })
      .execute();

    const result = await getTopics();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Physics');
    expect(result[0].description).toBeNull();
    expect(result[0].subject_id).toEqual(subjectId);
  });
});

describe('getTopicsBySubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no topics exist for subject', async () => {
    // Create a subject but no topics
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Empty Subject',
        description: 'Subject with no topics'
      })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const result = await getTopicsBySubject(subjectId);
    expect(result).toEqual([]);
  });

  it('should return topics for specific subject only', async () => {
    // Create two subjects
    const mathSubject = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();
    const mathSubjectId = mathSubject[0].id;

    const scienceSubject = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();
    const scienceSubjectId = scienceSubject[0].id;

    // Create topics for both subjects
    await db.insert(topicsTable)
      .values([
        {
          name: 'Algebra',
          description: 'Math topic',
          subject_id: mathSubjectId
        },
        {
          name: 'Geometry',
          description: 'Math topic',
          subject_id: mathSubjectId
        },
        {
          name: 'Physics',
          description: 'Science topic',
          subject_id: scienceSubjectId
        }
      ])
      .execute();

    // Get topics for math subject only
    const result = await getTopicsBySubject(mathSubjectId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Algebra');
    expect(result[0].subject_id).toEqual(mathSubjectId);
    expect(result[1].name).toEqual('Geometry');
    expect(result[1].subject_id).toEqual(mathSubjectId);

    // Verify science topic is not included
    const hasPhysics = result.some(topic => topic.name === 'Physics');
    expect(hasPhysics).toBe(false);
  });

  it('should return topics with all fields populated correctly', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'History',
        description: 'History subject'
      })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    // Create topic with full data
    await db.insert(topicsTable)
      .values({
        name: 'World War II',
        description: 'Events of WWII',
        subject_id: subjectId
      })
      .execute();

    const result = await getTopicsBySubject(subjectId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('World War II');
    expect(result[0].description).toEqual('Events of WWII');
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent subject', async () => {
    const nonExistentSubjectId = 999999;
    const result = await getTopicsBySubject(nonExistentSubjectId);
    expect(result).toEqual([]);
  });

  it('should handle topics with mixed null and non-null descriptions', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Literature',
        description: 'Literature subject'
      })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    // Create topics with mixed descriptions
    await db.insert(topicsTable)
      .values([
        {
          name: 'Poetry',
          description: 'Study of poems',
          subject_id: subjectId
        },
        {
          name: 'Drama',
          description: null,
          subject_id: subjectId
        }
      ])
      .execute();

    const result = await getTopicsBySubject(subjectId);

    expect(result).toHaveLength(2);
    
    const poetry = result.find(topic => topic.name === 'Poetry');
    expect(poetry).toBeDefined();
    expect(poetry?.description).toEqual('Study of poems');

    const drama = result.find(topic => topic.name === 'Drama');
    expect(drama).toBeDefined();
    expect(drama?.description).toBeNull();
  });
});
