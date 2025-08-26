import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { getQuestions } from '../handlers/get_questions';

describe('getQuestions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();
    
    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Algebra', 
        subject_id: subjectResult[0].id 
      })
      .returning()
      .execute();
    
    await db.insert(questionsTable)
      .values([
        {
          text: 'What is 2+2?',
          type: 'Multiple Choice',
          correct_answer: '4',
          subject_id: subjectResult[0].id,
          topic_id: topicResult[0].id
        },
        {
          text: 'What is the quadratic formula?',
          type: 'Open Ended',
          correct_answer: 'x = (-b ± √(b²-4ac)) / 2a',
          subject_id: subjectResult[0].id,
          topic_id: topicResult[0].id
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all questions', async () => {
    const questions = await getQuestions();
    
    expect(questions).toHaveLength(2);
    
    // Check first question
    expect(questions[0]).toEqual({
      id: expect.any(Number),
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: expect.any(Number),
      topic_id: expect.any(Number),
      created_at: expect.any(Date)
    });
    
    // Check second question
    expect(questions[1]).toEqual({
      id: expect.any(Number),
      text: 'What is the quadratic formula?',
      type: 'Open Ended',
      correct_answer: 'x = (-b ± √(b²-4ac)) / 2a',
      subject_id: expect.any(Number),
      topic_id: expect.any(Number),
      created_at: expect.any(Date)
    });
  });

  it('should return empty array when no questions exist', async () => {
    // Clear all questions
    await db.delete(questionsTable).execute();
    
    const questions = await getQuestions();
    
    expect(questions).toHaveLength(0);
  });
});
