import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Helper to insert a question directly
const insertQuestion = async (question: Omit<Question, 'id' | 'created_at'>): Promise<Question> => {
  const result = await db.insert(questionsTable)
    .values(question as any)
    .returning()
    .execute();
  return result[0] as Question;
};

describe('updateQuestion handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and retains unchanged fields', async () => {
    // Insert initial question
    const original = await insertQuestion({
      subject: 'Math',
      topic: 'Algebra',
      question_text: 'What is 2+2?',
      answer_text: '4',
    });

    const input: UpdateQuestionInput = {
      id: original.id,
      // Only update subject and answer_text
      subject: 'Science',
      answer_text: 'Four',
    };

    const updated = await updateQuestion(input);

    // Verify updated fields
    expect(updated.subject).toBe('Science');
    expect(updated.answer_text).toBe('Four');
    // Verify unchanged fields remain the same
    expect(updated.topic).toBe(original.topic);
    expect(updated.question_text).toBe(original.question_text);
    expect(updated.id).toBe(original.id);
    // created_at should be a Date
    expect(updated.created_at).toBeInstanceOf(Date);
  });

  it('throws an error when question does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: 9999,
      subject: 'Nonexistent',
    };

    await expect(updateQuestion(input)).rejects.toThrow(/Question with id 9999 not found/);
  });
});
