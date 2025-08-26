import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';
import { getQuestions } from '../handlers/get_questions';

// Helper to insert a question directly into DB
const insertQuestion = async (question: Omit<Question, 'id' | 'created_at'>) => {
  const result = await db.insert(questionsTable).values(question).returning().execute();
  return result[0];
};

describe('getQuestions handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns empty array when no questions exist', async () => {
    const result = await getQuestions();
    expect(result).toEqual([]);
  });

  it('fetches all inserted questions', async () => {
    const q1 = await insertQuestion({
      subject: 'Math',
      topic: 'Algebra',
      question_text: 'What is 2+2?',
      answer_text: '4',
    });
    const q2 = await insertQuestion({
      subject: 'Science',
      topic: 'Physics',
      question_text: 'What is the speed of light?',
      answer_text: '299,792,458 m/s',
    });

    const result = await getQuestions();
    expect(result).toHaveLength(2);
    const ids = result.map(r => r.id);
    expect(ids).toContain(q1.id);
    expect(ids).toContain(q2.id);

    const fetched1 = result.find(r => r.id === q1.id) as Question;
    expect(fetched1.subject).toBe('Math');
    expect(fetched1.topic).toBe('Algebra');
    expect(fetched1.question_text).toBe('What is 2+2?');
    expect(fetched1.answer_text).toBe('4');
    expect(fetched1.created_at).toBeInstanceOf(Date);
  });
});
