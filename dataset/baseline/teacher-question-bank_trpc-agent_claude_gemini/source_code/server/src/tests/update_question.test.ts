import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Test data setup
const testSubject = {
  name: 'Test Subject',
  description: 'A subject for testing'
};

const testTopic = {
  name: 'Test Topic',
  description: 'A topic for testing',
  subject_id: 0 // Will be set after creating subject
};

const testQuestion = {
  question_text: 'Original question text?',
  option_a: 'Original Option A',
  option_b: 'Original Option B',
  option_c: 'Original Option C',
  option_d: 'Original Option D',
  correct_answer: 'A' as const,
  explanation: 'Original explanation',
  difficulty_level: 'easy' as const,
  subject_id: 0, // Will be set after creating subject
  topic_id: 0 // Will be set after creating topic
};

describe('updateQuestion', () => {
  let subjectId: number;
  let topicId: number;
  let questionId: number;

  beforeEach(async () => {
    await createDB();

    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();
    subjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        ...testTopic,
        subject_id: subjectId
      })
      .returning()
      .execute();
    topicId = topicResult[0].id;

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        ...testQuestion,
        subject_id: subjectId,
        topic_id: topicId
      })
      .returning()
      .execute();
    questionId = questionResult[0].id;
  });

  afterEach(resetDB);

  it('should update question text only', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Updated question text?'
    };

    const result = await updateQuestion(updateInput);

    expect(result.id).toEqual(questionId);
    expect(result.question_text).toEqual('Updated question text?');
    expect(result.option_a).toEqual('Original Option A'); // Should remain unchanged
    expect(result.option_b).toEqual('Original Option B'); // Should remain unchanged
    expect(result.correct_answer).toEqual('A'); // Should remain unchanged
    expect(result.difficulty_level).toEqual('easy'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Completely new question?',
      option_a: 'New Option A',
      option_b: 'New Option B',
      correct_answer: 'B',
      difficulty_level: 'hard',
      explanation: 'New explanation'
    };

    const result = await updateQuestion(updateInput);

    expect(result.question_text).toEqual('Completely new question?');
    expect(result.option_a).toEqual('New Option A');
    expect(result.option_b).toEqual('New Option B');
    expect(result.option_c).toEqual('Original Option C'); // Unchanged
    expect(result.option_d).toEqual('Original Option D'); // Unchanged
    expect(result.correct_answer).toEqual('B');
    expect(result.difficulty_level).toEqual('hard');
    expect(result.explanation).toEqual('New explanation');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update explanation to null', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      explanation: null
    };

    const result = await updateQuestion(updateInput);

    expect(result.explanation).toBeNull();
    expect(result.question_text).toEqual('Original question text?'); // Unchanged
  });

  it('should update subject and topic references', async () => {
    // Create another subject and topic
    const newSubject = await db.insert(subjectsTable)
      .values({
        name: 'New Subject',
        description: 'Another subject'
      })
      .returning()
      .execute();

    const newTopic = await db.insert(topicsTable)
      .values({
        name: 'New Topic',
        description: 'Another topic',
        subject_id: newSubject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: newSubject[0].id,
      topic_id: newTopic[0].id
    };

    const result = await updateQuestion(updateInput);

    expect(result.subject_id).toEqual(newSubject[0].id);
    expect(result.topic_id).toEqual(newTopic[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Persisted question?',
      difficulty_level: 'medium'
    };

    await updateQuestion(updateInput);

    // Verify changes were persisted
    const savedQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(savedQuestion).toHaveLength(1);
    expect(savedQuestion[0].question_text).toEqual('Persisted question?');
    expect(savedQuestion[0].difficulty_level).toEqual('medium');
    expect(savedQuestion[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent question', async () => {
    const updateInput: UpdateQuestionInput = {
      id: 99999,
      question_text: 'This should fail'
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Question with id 99999 not found/);
  });

  it('should throw error for non-existent subject', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Subject with id 99999 not found/);
  });

  it('should throw error for non-existent topic', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      topic_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic with id 99999 not found/);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Create another subject with its own topic
    const anotherSubject = await db.insert(subjectsTable)
      .values({
        name: 'Another Subject',
        description: 'Unrelated subject'
      })
      .returning()
      .execute();

    const anotherTopic = await db.insert(topicsTable)
      .values({
        name: 'Another Topic',
        description: 'Topic for another subject',
        subject_id: anotherSubject[0].id
      })
      .returning()
      .execute();

    // Try to update question to use topic from different subject
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: subjectId, // Keep original subject
      topic_id: anotherTopic[0].id // But use topic from different subject
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/does not belong to subject/);
  });

  it('should validate topic belongs to new subject when both are updated', async () => {
    // Create new subject and topic
    const newSubject = await db.insert(subjectsTable)
      .values({
        name: 'Valid New Subject',
        description: 'Subject with matching topic'
      })
      .returning()
      .execute();

    const validTopic = await db.insert(topicsTable)
      .values({
        name: 'Valid Topic',
        description: 'Topic that belongs to new subject',
        subject_id: newSubject[0].id
      })
      .returning()
      .execute();

    // Create unrelated topic
    const unrelatedSubject = await db.insert(subjectsTable)
      .values({
        name: 'Unrelated Subject',
        description: 'Subject with unrelated topic'
      })
      .returning()
      .execute();

    const unrelatedTopic = await db.insert(topicsTable)
      .values({
        name: 'Unrelated Topic',
        description: 'Topic that does not belong to new subject',
        subject_id: unrelatedSubject[0].id
      })
      .returning()
      .execute();

    // This should work - topic belongs to subject
    const validInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: newSubject[0].id,
      topic_id: validTopic[0].id
    };

    const result = await updateQuestion(validInput);
    expect(result.subject_id).toEqual(newSubject[0].id);
    expect(result.topic_id).toEqual(validTopic[0].id);

    // This should fail - topic doesn't belong to subject
    const invalidInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: newSubject[0].id,
      topic_id: unrelatedTopic[0].id
    };

    await expect(updateQuestion(invalidInput)).rejects.toThrow(/does not belong to subject/);
  });
});
