import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type CreateMultipleChoiceOptionInput } from '../schema';
import { createMultipleChoiceOption } from '../handlers/create_multiple_choice_option';
import { eq } from 'drizzle-orm';

describe('createMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testSubjectId: number;
  let testTopicId: number;
  let testQuestionId: number;
  let nonMultipleChoiceQuestionId: number;

  beforeEach(async () => {
    // Create prerequisite data: subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A test subject'
      })
      .returning()
      .execute();
    testSubjectId = subjectResult[0].id;

    // Create prerequisite data: topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A test topic',
        subject_id: testSubjectId
      })
      .returning()
      .execute();
    testTopicId = topicResult[0].id;

    // Create prerequisite data: multiple-choice question
    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: testSubjectId,
        topic_id: testTopicId,
        type: 'multiple-choice',
        answer: 'Paris'
      })
      .returning()
      .execute();
    testQuestionId = questionResult[0].id;

    // Create a non-multiple-choice question for testing validation
    const nonMCQuestionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Explain photosynthesis',
        subject_id: testSubjectId,
        topic_id: testTopicId,
        type: 'open-ended',
        answer: 'Process by which plants make food using sunlight'
      })
      .returning()
      .execute();
    nonMultipleChoiceQuestionId = nonMCQuestionResult[0].id;
  });

  it('should create a multiple choice option', async () => {
    const testInput: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'Paris',
      is_correct: true
    };

    const result = await createMultipleChoiceOption(testInput);

    expect(result.question_id).toEqual(testQuestionId);
    expect(result.option_text).toEqual('Paris');
    expect(result.is_correct).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save multiple choice option to database', async () => {
    const testInput: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'London',
      is_correct: false
    };

    const result = await createMultipleChoiceOption(testInput);

    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, result.id))
      .execute();

    expect(options).toHaveLength(1);
    expect(options[0].question_id).toEqual(testQuestionId);
    expect(options[0].option_text).toEqual('London');
    expect(options[0].is_correct).toEqual(false);
    expect(options[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple options for the same question', async () => {
    const option1: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'Paris',
      is_correct: true
    };

    const option2: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'London',
      is_correct: false
    };

    const option3: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'Berlin',
      is_correct: false
    };

    const result1 = await createMultipleChoiceOption(option1);
    const result2 = await createMultipleChoiceOption(option2);
    const result3 = await createMultipleChoiceOption(option3);

    // Verify all options were created
    const allOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, testQuestionId))
      .execute();

    expect(allOptions).toHaveLength(3);
    
    const optionTexts = allOptions.map(opt => opt.option_text).sort();
    expect(optionTexts).toEqual(['Berlin', 'London', 'Paris']);

    // Verify only one is marked as correct
    const correctOptions = allOptions.filter(opt => opt.is_correct);
    expect(correctOptions).toHaveLength(1);
    expect(correctOptions[0].option_text).toEqual('Paris');
  });

  it('should throw error for non-existent question', async () => {
    const testInput: CreateMultipleChoiceOptionInput = {
      question_id: 99999,
      option_text: 'Test Option',
      is_correct: true
    };

    await expect(createMultipleChoiceOption(testInput))
      .rejects.toThrow(/Question with id 99999 not found/i);
  });

  it('should throw error for non-multiple-choice question', async () => {
    const testInput: CreateMultipleChoiceOptionInput = {
      question_id: nonMultipleChoiceQuestionId,
      option_text: 'Test Option',
      is_correct: true
    };

    await expect(createMultipleChoiceOption(testInput))
      .rejects.toThrow(/is not a multiple-choice question/i);
  });

  it('should handle boolean values correctly', async () => {
    const correctOption: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'Correct Answer',
      is_correct: true
    };

    const incorrectOption: CreateMultipleChoiceOptionInput = {
      question_id: testQuestionId,
      option_text: 'Wrong Answer',
      is_correct: false
    };

    const result1 = await createMultipleChoiceOption(correctOption);
    const result2 = await createMultipleChoiceOption(incorrectOption);

    expect(typeof result1.is_correct).toBe('boolean');
    expect(typeof result2.is_correct).toBe('boolean');
    expect(result1.is_correct).toBe(true);
    expect(result2.is_correct).toBe(false);
  });
});
