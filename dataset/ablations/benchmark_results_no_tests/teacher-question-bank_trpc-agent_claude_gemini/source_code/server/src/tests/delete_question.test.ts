import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  subjectsTable, 
  topicsTable, 
  questionsTable, 
  multipleChoiceOptionsTable, 
  quizzesTable,
  quizQuestionsTable
} from '../db/schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a question successfully', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    // Delete the question
    const result = await deleteQuestion(question[0].id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify question is no longer in database
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question[0].id))
      .execute();

    expect(remainingQuestions).toHaveLength(0);
  });

  it('should return false when attempting to delete non-existent question', async () => {
    const nonExistentId = 99999;

    const result = await deleteQuestion(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should cascade delete multiple choice options', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: question[0].id,
          option_text: '2',
          is_correct: false
        },
        {
          question_id: question[0].id,
          option_text: '4',
          is_correct: true
        },
        {
          question_id: question[0].id,
          option_text: '6',
          is_correct: false
        }
      ])
      .execute();

    // Verify options exist before deletion
    const optionsBeforeDelete = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, question[0].id))
      .execute();

    expect(optionsBeforeDelete).toHaveLength(3);

    // Delete the question
    const result = await deleteQuestion(question[0].id);

    expect(result.success).toBe(true);

    // Verify multiple choice options were cascade deleted
    const optionsAfterDelete = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, question[0].id))
      .execute();

    expect(optionsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete quiz question associations', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    // Create a quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing'
      })
      .returning()
      .execute();

    // Associate question with quiz
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz[0].id,
        question_id: question[0].id,
        order_index: 1
      })
      .execute();

    // Verify association exists before deletion
    const associationsBeforeDelete = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question[0].id))
      .execute();

    expect(associationsBeforeDelete).toHaveLength(1);

    // Delete the question
    const result = await deleteQuestion(question[0].id);

    expect(result.success).toBe(true);

    // Verify quiz question association was cascade deleted
    const associationsAfterDelete = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question[0].id))
      .execute();

    expect(associationsAfterDelete).toHaveLength(0);

    // Verify quiz itself still exists
    const quizAfterDelete = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz[0].id))
      .execute();

    expect(quizAfterDelete).toHaveLength(1);
  });

  it('should handle deletion of question with no related data', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'short-answer',
        answer: 'Paris'
      })
      .returning()
      .execute();

    // Delete the question (no related multiple choice options or quiz associations)
    const result = await deleteQuestion(question[0].id);

    expect(result.success).toBe(true);

    // Verify question was deleted
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question[0].id))
      .execute();

    expect(remainingQuestions).toHaveLength(0);
  });
});
