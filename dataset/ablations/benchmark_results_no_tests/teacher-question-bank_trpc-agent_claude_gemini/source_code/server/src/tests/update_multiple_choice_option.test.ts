import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type UpdateMultipleChoiceOptionInput } from '../schema';
import { updateMultipleChoiceOption } from '../handlers/update_multiple_choice_option';
import { eq } from 'drizzle-orm';

describe('updateMultipleChoiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let subjectId: number;
  let topicId: number;
  let questionId: number;
  let optionId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();
    subjectId = subject[0].id;

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectId
      })
      .returning()
      .execute();
    topicId = topic[0].id;

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subjectId,
        topic_id: topicId,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();
    questionId = question[0].id;

    const option = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: questionId,
        option_text: 'Original Option',
        is_correct: false
      })
      .returning()
      .execute();
    optionId = option[0].id;
  });

  it('should update option text only', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'Updated Option Text'
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result.id).toEqual(optionId);
    expect(result.option_text).toEqual('Updated Option Text');
    expect(result.is_correct).toEqual(false); // Should remain unchanged
    expect(result.question_id).toEqual(questionId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update is_correct flag only', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      is_correct: true
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result.id).toEqual(optionId);
    expect(result.option_text).toEqual('Original Option'); // Should remain unchanged
    expect(result.is_correct).toEqual(true);
    expect(result.question_id).toEqual(questionId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both option text and is_correct', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'Completely New Option',
      is_correct: true
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result.id).toEqual(optionId);
    expect(result.option_text).toEqual('Completely New Option');
    expect(result.is_correct).toEqual(true);
    expect(result.question_id).toEqual(questionId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      option_text: 'Database Test Option',
      is_correct: true
    };

    await updateMultipleChoiceOption(input);

    // Verify the changes were saved to database
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(options).toHaveLength(1);
    expect(options[0].option_text).toEqual('Database Test Option');
    expect(options[0].is_correct).toEqual(true);
    expect(options[0].question_id).toEqual(questionId);
  });

  it('should throw error for non-existent option id', async () => {
    const input: UpdateMultipleChoiceOptionInput = {
      id: 99999,
      option_text: 'This should fail'
    };

    expect(updateMultipleChoiceOption(input)).rejects.toThrow(/not found/i);
  });

  it('should handle setting is_correct to false explicitly', async () => {
    // First set option to correct
    await db.update(multipleChoiceOptionsTable)
      .set({ is_correct: true })
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    const input: UpdateMultipleChoiceOptionInput = {
      id: optionId,
      is_correct: false
    };

    const result = await updateMultipleChoiceOption(input);

    expect(result.is_correct).toEqual(false);

    // Verify in database
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, optionId))
      .execute();

    expect(options[0].is_correct).toEqual(false);
  });
});
