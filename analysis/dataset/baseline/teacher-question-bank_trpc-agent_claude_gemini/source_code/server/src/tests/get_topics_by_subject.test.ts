import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { type GetTopicsBySubjectInput, type CreateSubjectInput, type CreateTopicInput } from '../schema';
import { getTopicsBySubject } from '../handlers/get_topics_by_subject';

// Helper function to create a subject for testing
const createTestSubject = async (input: CreateSubjectInput) => {
  const result = await db.insert(subjectsTable)
    .values({
      name: input.name,
      description: input.description
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a topic for testing
const createTestTopic = async (input: CreateTopicInput) => {
  const result = await db.insert(topicsTable)
    .values({
      name: input.name,
      description: input.description,
      subject_id: input.subject_id
    })
    .returning()
    .execute();
  return result[0];
};

describe('getTopicsBySubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return topics for a specific subject', async () => {
    // Create test subjects
    const subject1 = await createTestSubject({
      name: 'Mathematics',
      description: 'Math subject'
    });
    
    const subject2 = await createTestSubject({
      name: 'Physics',
      description: 'Physics subject'
    });

    // Create topics for subject1
    await createTestTopic({
      name: 'Algebra',
      description: 'Basic algebra concepts',
      subject_id: subject1.id
    });

    await createTestTopic({
      name: 'Geometry',
      description: 'Geometric shapes and theorems',
      subject_id: subject1.id
    });

    // Create topic for subject2
    await createTestTopic({
      name: 'Mechanics',
      description: 'Classical mechanics',
      subject_id: subject2.id
    });

    const input: GetTopicsBySubjectInput = {
      subject_id: subject1.id
    };

    const result = await getTopicsBySubject(input);

    // Should return only topics for subject1
    expect(result).toHaveLength(2);
    expect(result[0].subject_id).toEqual(subject1.id);
    expect(result[1].subject_id).toEqual(subject1.id);
    
    // Check topic names are returned
    const topicNames = result.map(topic => topic.name).sort();
    expect(topicNames).toEqual(['Algebra', 'Geometry']);
  });

  it('should return empty array when subject has no topics', async () => {
    // Create a subject with no topics
    const subject = await createTestSubject({
      name: 'Chemistry',
      description: 'Chemistry subject'
    });

    const input: GetTopicsBySubjectInput = {
      subject_id: subject.id
    };

    const result = await getTopicsBySubject(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent subject', async () => {
    const input: GetTopicsBySubjectInput = {
      subject_id: 99999 // Non-existent subject ID
    };

    const result = await getTopicsBySubject(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return topics with all required fields', async () => {
    // Create test subject and topic
    const subject = await createTestSubject({
      name: 'Biology',
      description: 'Life sciences'
    });

    await createTestTopic({
      name: 'Cell Biology',
      description: 'Study of cells',
      subject_id: subject.id
    });

    const input: GetTopicsBySubjectInput = {
      subject_id: subject.id
    };

    const result = await getTopicsBySubject(input);

    expect(result).toHaveLength(1);
    const topic = result[0];

    // Verify all required fields are present
    expect(topic.id).toBeDefined();
    expect(typeof topic.id).toBe('number');
    expect(topic.name).toEqual('Cell Biology');
    expect(topic.description).toEqual('Study of cells');
    expect(topic.subject_id).toEqual(subject.id);
    expect(topic.created_at).toBeInstanceOf(Date);
  });

  it('should handle topics with null descriptions', async () => {
    // Create test subject
    const subject = await createTestSubject({
      name: 'Art',
      description: 'Creative arts'
    });

    // Create topic with null description
    await createTestTopic({
      name: 'Painting',
      description: null,
      subject_id: subject.id
    });

    const input: GetTopicsBySubjectInput = {
      subject_id: subject.id
    };

    const result = await getTopicsBySubject(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Painting');
    expect(result[0].description).toBeNull();
  });

  it('should return topics in creation order', async () => {
    // Create test subject
    const subject = await createTestSubject({
      name: 'History',
      description: 'World history'
    });

    // Create topics in specific order
    const topic1 = await createTestTopic({
      name: 'Ancient History',
      description: 'Ancient civilizations',
      subject_id: subject.id
    });

    const topic2 = await createTestTopic({
      name: 'Modern History',
      description: 'Recent historical events',
      subject_id: subject.id
    });

    const input: GetTopicsBySubjectInput = {
      subject_id: subject.id
    };

    const result = await getTopicsBySubject(input);

    expect(result).toHaveLength(2);
    // Topics should be in creation order (by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('Ancient History');
    expect(result[1].name).toEqual('Modern History');
  });
});
