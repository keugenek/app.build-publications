import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteMultipleChoiceOption } from '../handlers/delete_multiple_choice_option';

describe('deleteMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing multiple choice option', async () => {
    // Create prerequisite data: subject -> topic -> question -> option
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        type: 'multiple-choice',
        answer: 'Paris'
      })
      .returning()
      .execute();

    const optionResult = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Paris',
        is_correct: true
      })
      .returning()
      .execute();

    const optionId = optionResult[0].id;

    // Delete the option
    const result = await deleteMultipleChoiceOption(optionId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify option no longer exists in database
    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(remainingOptions).toHaveLength(0);
  });

  it('should return success false for non-existent option', async () => {
    // Try to delete an option that doesn't exist
    const result = await deleteMultipleChoiceOption(999);

    expect(result.success).toBe(false);
  });

  it('should delete only the specified option', async () => {
    // Create prerequisite data: subject -> topic -> question -> multiple options
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        type: 'multiple-choice',
        answer: 'Paris'
      })
      .returning()
      .execute();

    // Create multiple options for the same question
    const option1Result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Paris',
        is_correct: true
      })
      .returning()
      .execute();

    const option2Result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'London',
        is_correct: false
      })
      .returning()
      .execute();

    const option3Result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Berlin',
        is_correct: false
      })
      .returning()
      .execute();

    // Delete only the second option
    const result = await deleteMultipleChoiceOption(option2Result[0].id);

    expect(result.success).toBe(true);

    // Verify only the second option was deleted
    const remainingOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionResult[0].id))
      .execute();

    expect(remainingOptions).toHaveLength(2);
    
    const remainingIds = remainingOptions.map(option => option.id);
    expect(remainingIds).toContain(option1Result[0].id);
    expect(remainingIds).toContain(option3Result[0].id);
    expect(remainingIds).not.toContain(option2Result[0].id);
  });

  it('should handle database constraint violations gracefully', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        type: 'multiple-choice',
        answer: 'Paris'
      })
      .returning()
      .execute();

    const optionResult = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionResult[0].id,
        option_text: 'Paris',
        is_correct: true
      })
      .returning()
      .execute();

    // First deletion should succeed
    const firstResult = await deleteMultipleChoiceOption(optionResult[0].id);
    expect(firstResult.success).toBe(true);

    // Second attempt to delete the same option should return false
    const secondResult = await deleteMultipleChoiceOption(optionResult[0].id);
    expect(secondResult.success).toBe(false);
  });
});
