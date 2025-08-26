import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  subjectsTable, 
  topicsTable, 
  questionsTable, 
  quizzesTable,
  quizQuestionsTable 
} from '../db/schema';
import { removeQuestionFromQuiz } from '../handlers/remove_question_from_quiz';
import { eq, asc } from 'drizzle-orm';

describe('removeQuestionFromQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove a question from a quiz and reorder remaining questions', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Subject for testing' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Topic for testing',
        subject_id: subject[0].id 
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Quiz for testing' })
      .returning()
      .execute();

    // Create three questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Question 1',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'multiple-choice',
          answer: 'Answer 1'
        },
        {
          question_text: 'Question 2',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'open-ended',
          answer: 'Answer 2'
        },
        {
          question_text: 'Question 3',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'true-false',
          answer: 'Answer 3'
        }
      ])
      .returning()
      .execute();

    // Add all questions to quiz with specific order
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz[0].id, question_id: questions[0].id, order_index: 1 },
        { quiz_id: quiz[0].id, question_id: questions[1].id, order_index: 2 },
        { quiz_id: quiz[0].id, question_id: questions[2].id, order_index: 3 }
      ])
      .execute();

    // Remove the middle question (question 2 with order_index 2)
    const result = await removeQuestionFromQuiz(quiz[0].id, questions[1].id);

    expect(result.success).toBe(true);

    // Verify the question was removed
    const remainingQuizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .orderBy(asc(quizQuestionsTable.order_index))
      .execute();

    expect(remainingQuizQuestions).toHaveLength(2);

    // Verify order indices were reordered correctly
    expect(remainingQuizQuestions[0].question_id).toBe(questions[0].id);
    expect(remainingQuizQuestions[0].order_index).toBe(1);

    expect(remainingQuizQuestions[1].question_id).toBe(questions[2].id);
    expect(remainingQuizQuestions[1].order_index).toBe(2); // Was 3, now 2
  });

  it('should remove the first question and reorder remaining questions', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Subject for testing' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Topic for testing',
        subject_id: subject[0].id 
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Quiz for testing' })
      .returning()
      .execute();

    // Create three questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Question 1',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'multiple-choice',
          answer: 'Answer 1'
        },
        {
          question_text: 'Question 2',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'open-ended',
          answer: 'Answer 2'
        },
        {
          question_text: 'Question 3',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'true-false',
          answer: 'Answer 3'
        }
      ])
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz[0].id, question_id: questions[0].id, order_index: 1 },
        { quiz_id: quiz[0].id, question_id: questions[1].id, order_index: 2 },
        { quiz_id: quiz[0].id, question_id: questions[2].id, order_index: 3 }
      ])
      .execute();

    // Remove the first question
    const result = await removeQuestionFromQuiz(quiz[0].id, questions[0].id);

    expect(result.success).toBe(true);

    // Verify reordering
    const remainingQuizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .orderBy(asc(quizQuestionsTable.order_index))
      .execute();

    expect(remainingQuizQuestions).toHaveLength(2);
    expect(remainingQuizQuestions[0].question_id).toBe(questions[1].id);
    expect(remainingQuizQuestions[0].order_index).toBe(1); // Was 2, now 1
    expect(remainingQuizQuestions[1].question_id).toBe(questions[2].id);
    expect(remainingQuizQuestions[1].order_index).toBe(2); // Was 3, now 2
  });

  it('should remove the last question without affecting other order indices', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Subject for testing' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Topic for testing',
        subject_id: subject[0].id 
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Quiz for testing' })
      .returning()
      .execute();

    // Create three questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Question 1',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'multiple-choice',
          answer: 'Answer 1'
        },
        {
          question_text: 'Question 2',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'open-ended',
          answer: 'Answer 2'
        },
        {
          question_text: 'Question 3',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'true-false',
          answer: 'Answer 3'
        }
      ])
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz[0].id, question_id: questions[0].id, order_index: 1 },
        { quiz_id: quiz[0].id, question_id: questions[1].id, order_index: 2 },
        { quiz_id: quiz[0].id, question_id: questions[2].id, order_index: 3 }
      ])
      .execute();

    // Remove the last question
    const result = await removeQuestionFromQuiz(quiz[0].id, questions[2].id);

    expect(result.success).toBe(true);

    // Verify no reordering needed for other questions
    const remainingQuizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .orderBy(asc(quizQuestionsTable.order_index))
      .execute();

    expect(remainingQuizQuestions).toHaveLength(2);
    expect(remainingQuizQuestions[0].question_id).toBe(questions[0].id);
    expect(remainingQuizQuestions[0].order_index).toBe(1); // Unchanged
    expect(remainingQuizQuestions[1].question_id).toBe(questions[1].id);
    expect(remainingQuizQuestions[1].order_index).toBe(2); // Unchanged
  });

  it('should return success when removing a question that is not in the quiz', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Subject for testing' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Topic for testing',
        subject_id: subject[0].id 
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Quiz for testing' })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'Question not in quiz',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: 'Answer'
      })
      .returning()
      .execute();

    // Try to remove a question that was never added to the quiz
    const result = await removeQuestionFromQuiz(quiz[0].id, question[0].id);

    expect(result.success).toBe(true);

    // Verify no changes to quiz questions
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .execute();

    expect(quizQuestions).toHaveLength(0);
  });

  it('should handle removing the only question from a quiz', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Subject for testing' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Topic for testing',
        subject_id: subject[0].id 
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Quiz for testing' })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'Only Question',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: 'Only Answer'
      })
      .returning()
      .execute();

    // Add single question to quiz
    await db.insert(quizQuestionsTable)
      .values({ quiz_id: quiz[0].id, question_id: question[0].id, order_index: 1 })
      .execute();

    // Remove the only question
    const result = await removeQuestionFromQuiz(quiz[0].id, question[0].id);

    expect(result.success).toBe(true);

    // Verify quiz is now empty
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .execute();

    expect(quizQuestions).toHaveLength(0);
  });
});
