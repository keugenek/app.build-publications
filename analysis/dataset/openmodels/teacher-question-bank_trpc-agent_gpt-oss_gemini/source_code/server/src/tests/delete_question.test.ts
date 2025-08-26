import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteQuestion } from '../handlers/delete_question';
import { type CreateQuestionInput } from '../schema';

const testInput: CreateQuestionInput = {
  subject: 'History',
  topic: 'World War II',
  question_text: 'When did WWII end?',
  answer_text: '1945',
};

describe('deleteQuestion handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing question and return it', async () => {
    // Insert a question directly via DB
    const inserted = await db.insert(questionsTable)
      .values({
        subject: testInput.subject,
        topic: testInput.topic,
        question_text: testInput.question_text,
        answer_text: testInput.answer_text,
      })
      .returning()
      .execute();

    const question = inserted[0];
    expect(question.id).toBeDefined();

    // Call handler to delete
    const deleted = await deleteQuestion({ id: question.id });

    // Verify returned fields match inserted record (excluding created_at which may differ slightly)
    expect(deleted.id).toBe(question.id);
    expect(deleted.subject).toBe(question.subject);
    expect(deleted.topic).toBe(question.topic);
    expect(deleted.question_text).toBe(question.question_text);
    expect(deleted.answer_text).toBe(question.answer_text);
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure the question no longer exists in DB
    const remaining = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent question', async () => {
    await expect(deleteQuestion({ id: 9999 })).rejects.toThrow(/not found/i);
  });
});
