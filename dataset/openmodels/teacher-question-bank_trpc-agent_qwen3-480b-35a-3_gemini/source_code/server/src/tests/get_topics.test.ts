import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { getTopics, getTopicsBySubject } from '../handlers/get_topics';

describe('getTopics', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Math' }, { name: 'Science' }])
      .returning()
      .execute();
    
    // Create test topics
    await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Calculus', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id },
        { name: 'Chemistry', subject_id: subjects[1].id }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all topics', async () => {
    const topics = await getTopics();
    
    expect(topics).toHaveLength(4);
    expect(topics[0].name).toBe('Algebra');
    expect(topics[1].name).toBe('Calculus');
    expect(topics[2].name).toBe('Chemistry');
    expect(topics[3].name).toBe('Physics');
    
    // Verify proper date parsing
    topics.forEach(topic => {
      expect(topic.created_at).toBeInstanceOf(Date);
      expect(topic.id).toBeDefined();
      expect(topic.subject_id).toBeDefined();
    });
  });

  it('should return topics ordered by name', async () => {
    const topics = await getTopics();
    
    const topicNames = topics.map(topic => topic.name);
    const sortedNames = [...topicNames].sort();
    
    expect(topicNames).toEqual(sortedNames);
  });
});

describe('getTopicsBySubject', () => {
  let subjectId: number;
  let otherSubjectId: number;
  
  beforeEach(async () => {
    await createDB();
    
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Math' }, { name: 'Science' }])
      .returning()
      .execute();
    
    subjectId = subjects[0].id;
    otherSubjectId = subjects[1].id;
    
    // Create test topics
    await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjectId },
        { name: 'Calculus', subject_id: subjectId },
        { name: 'Physics', subject_id: otherSubjectId },
        { name: 'Chemistry', subject_id: otherSubjectId }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch topics by subject ID', async () => {
    const topics = await getTopicsBySubject(subjectId);
    
    expect(topics).toHaveLength(2);
    expect(topics[0].name).toBe('Algebra');
    expect(topics[1].name).toBe('Calculus');
    
    topics.forEach(topic => {
      expect(topic.subject_id).toBe(subjectId);
      expect(topic.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return topics ordered by name', async () => {
    const topics = await getTopicsBySubject(subjectId);
    
    const topicNames = topics.map(topic => topic.name);
    const sortedNames = [...topicNames].sort();
    
    expect(topicNames).toEqual(sortedNames);
  });

  it('should throw error for non-existent subject ID', async () => {
    await expect(getTopicsBySubject(99999))
      .rejects
      .toThrow(/Subject with ID 99999 not found/);
  });
});
