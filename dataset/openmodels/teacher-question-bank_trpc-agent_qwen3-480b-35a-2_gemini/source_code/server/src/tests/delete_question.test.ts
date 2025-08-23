import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable, quizQuestionsTable, quizzesTable } from '../db/schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a subject first
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();
    const subjectId = subjects[0].id;
    
    // Create a topic
    const topics = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topics[0].id;
    
    // Create a question
    await db.insert(questionsTable)
      .values({
        text: 'What is 2+2?',
        type: 'Multiple Choice',
        correct_answer: '4',
        subject_id: subjectId,
        topic_id: topicId
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should delete a question', async () => {
    // First, let's get the question we created
    const questions = await db.select()
      .from(questionsTable)
      .execute();
    const questionId = questions[0].id;
    
    // Delete the question
    const result = await deleteQuestion(questionId);
    
    // Verify it was deleted
    expect(result).toBe(true);
    
    // Verify the question no longer exists
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();
    expect(remainingQuestions).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent question', async () => {
    const result = await deleteQuestion(99999);
    expect(result).toBe(false);
  });

  it('should also delete associated quiz_question records', async () => {
    // First, get the question
    const questions = await db.select()
      .from(questionsTable)
      .execute();
    const questionId = questions[0].id;
    
    // Create a quiz
    const quizzes = await db.insert(quizzesTable)
      .values({ name: 'Test Quiz' })
      .returning()
      .execute();
    const quizId = quizzes[0].id;
    
    // Create a quiz_question association
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_id: questionId,
        order: 1
      })
      .execute();
    
    // Verify the association exists
    const quizQuestionsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionId))
      .execute();
    expect(quizQuestionsBefore).toHaveLength(1);
    
    // Delete the question
    const result = await deleteQuestion(questionId);
    expect(result).toBe(true);
    
    // Verify the quiz_question association was also deleted
    const quizQuestionsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionId))
      .execute();
    expect(quizQuestionsAfter).toHaveLength(0);
    
    // Verify the question was deleted
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();
    expect(remainingQuestions).toHaveLength(0);
  });
});
