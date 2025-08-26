import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;
    
    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subjectId })
      .returning()
      .execute();
    
    const topicId = topicResult[0].id;
    
    // Create a question for testing
    await db.insert(questionsTable)
      .values({
        text: 'What is 2 + 2?',
        answer: '4',
        subject_id: subjectId,
        topic_id: topicId
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should delete a question by id', async () => {
    // First, find the question we created
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2 + 2?'))
      .execute();
    
    expect(questions).toHaveLength(1);
    const questionId = questions[0].id;
    
    // Delete the question
    const result = await deleteQuestion(questionId);
    
    // Verify it was deleted
    expect(result).toBe(true);
    
    // Verify it no longer exists in the database
    const questionsAfter = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();
    
    expect(questionsAfter).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent question', async () => {
    const result = await deleteQuestion(99999);
    expect(result).toBe(false);
  });

  it('should delete associated quiz questions when deleting a question', async () => {
    // First, find the question we created
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2 + 2?'))
      .execute();
    
    const questionId = questions[0].id;
    
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ name: 'Math Quiz' })
      .returning()
      .execute();
    
    const quizId = quizResult[0].id;
    
    // Create a quiz question association
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_id: questionId,
        order: 1
      })
      .execute();
    
    // Verify the quiz question exists
    const quizQuestionsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionId))
      .execute();
    
    expect(quizQuestionsBefore).toHaveLength(1);
    
    // Delete the question
    const result = await deleteQuestion(questionId);
    expect(result).toBe(true);
    
    // Verify the quiz question was also deleted
    const quizQuestionsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionId))
      .execute();
    
    expect(quizQuestionsAfter).toHaveLength(0);
    
    // Verify the question itself was deleted
    const questionsAfter = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();
    
    expect(questionsAfter).toHaveLength(0);
  });
});
