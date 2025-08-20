import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  subjectsTable, 
  topicsTable, 
  questionsTable, 
  multipleChoiceOptionsTable 
} from '../db/schema';
import { type UpdateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

describe('updateQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let subjectId: number;
  let topicId: number;
  let questionId: number;
  let anotherSubjectId: number;
  let anotherTopicId: number;

  beforeEach(async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics', description: 'Math subject' },
        { name: 'Science', description: 'Science subject' }
      ])
      .returning()
      .execute();
    
    subjectId = subjects[0].id;
    anotherSubjectId = subjects[1].id;

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', description: 'Algebra topic', subject_id: subjectId },
        { name: 'Physics', description: 'Physics topic', subject_id: anotherSubjectId }
      ])
      .returning()
      .execute();
    
    topicId = topics[0].id;
    anotherTopicId = topics[1].id;

    // Create test question
    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'Original question?',
        subject_id: subjectId,
        topic_id: topicId,
        type: 'open-ended',
        answer: 'Original answer'
      })
      .returning()
      .execute();
    
    questionId = questions[0].id;
  });

  it('should update question text', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Updated question text?'
    };

    const result = await updateQuestion(updateInput);

    expect(result.id).toEqual(questionId);
    expect(result.question_text).toEqual('Updated question text?');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.topic_id).toEqual(topicId);
    expect(result.type).toEqual('open-ended');
    expect(result.answer).toEqual('Original answer');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.options).toBeUndefined();
  });

  it('should update question type', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      type: 'true-false'
    };

    const result = await updateQuestion(updateInput);

    expect(result.type).toEqual('true-false');
    expect(result.question_text).toEqual('Original question?');
  });

  it('should update answer', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      answer: 'Updated answer'
    };

    const result = await updateQuestion(updateInput);

    expect(result.answer).toEqual('Updated answer');
    expect(result.question_text).toEqual('Original question?');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'New question?',
      type: 'short-answer',
      answer: 'New answer'
    };

    const result = await updateQuestion(updateInput);

    expect(result.question_text).toEqual('New question?');
    expect(result.type).toEqual('short-answer');
    expect(result.answer).toEqual('New answer');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.topic_id).toEqual(topicId);
  });

  it('should update subject_id and topic_id when they are related', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: anotherSubjectId,
      topic_id: anotherTopicId
    };

    const result = await updateQuestion(updateInput);

    expect(result.subject_id).toEqual(anotherSubjectId);
    expect(result.topic_id).toEqual(anotherTopicId);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();
    
    const originalTimestamp = originalQuestion[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Updated question'
    };

    const result = await updateQuestion(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should return options for multiple-choice questions', async () => {
    // First update to multiple-choice type
    await updateQuestion({
      id: questionId,
      type: 'multiple-choice'
    });

    // Add some options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        { question_id: questionId, option_text: 'Option A', is_correct: true },
        { question_id: questionId, option_text: 'Option B', is_correct: false }
      ])
      .execute();

    // Update question text
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Multiple choice question?'
    };

    const result = await updateQuestion(updateInput);

    expect(result.type).toEqual('multiple-choice');
    expect(result.options).toBeDefined();
    expect(result.options).toHaveLength(2);
    expect(result.options?.[0].option_text).toEqual('Option A');
    expect(result.options?.[0].is_correct).toEqual(true);
    expect(result.options?.[1].option_text).toEqual('Option B');
    expect(result.options?.[1].is_correct).toEqual(false);
  });

  it('should save updated question to database', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      question_text: 'Database test question?',
      type: 'true-false'
    };

    await updateQuestion(updateInput);

    // Verify in database
    const savedQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    expect(savedQuestion).toHaveLength(1);
    expect(savedQuestion[0].question_text).toEqual('Database test question?');
    expect(savedQuestion[0].type).toEqual('true-false');
  });

  it('should throw error when question not found', async () => {
    const updateInput: UpdateQuestionInput = {
      id: 99999,
      question_text: 'Non-existent question'
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Question not found/i);
  });

  it('should throw error when subject_id does not exist', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Subject not found/i);
  });

  it('should throw error when topic_id does not exist', async () => {
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      topic_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic not found/i);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Try to update to a topic that belongs to a different subject
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: subjectId,
      topic_id: anotherTopicId // This topic belongs to anotherSubjectId
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic not found or does not belong to the specified subject/i);
  });

  it('should validate topic belongs to subject when only updating topic_id', async () => {
    // Try to update only topic_id to a topic that doesn't belong to current subject
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      topic_id: anotherTopicId // This topic belongs to different subject
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic not found or does not belong to the specified subject/i);
  });

  it('should validate topic belongs to subject when only updating subject_id', async () => {
    // Try to update only subject_id while keeping current topic (which won't belong to new subject)
    const updateInput: UpdateQuestionInput = {
      id: questionId,
      subject_id: anotherSubjectId // Current topic belongs to original subject
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic not found or does not belong to the specified subject/i);
  });
});
