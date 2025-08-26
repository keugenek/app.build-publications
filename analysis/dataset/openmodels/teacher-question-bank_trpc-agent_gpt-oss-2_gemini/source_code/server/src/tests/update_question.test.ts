import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateQuestionInput, type Question } from '../schema';
import { updateQuestion } from '../handlers/update_question';

// Helper to create a question in DB
const insertQuestion = async (question: { subject: string; topic: string; content: string; }) => {
  const result = await db
    .insert(questionsTable)
    .values(question)
    .returning()
    .execute();
  return result[0] as Question;
};

describe('updateQuestion handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates all fields of an existing question', async () => {
    // Insert initial question
    const original = await insertQuestion({
      subject: 'Math',
      topic: 'Algebra',
      content: 'What is x?',
    });

    const input: UpdateQuestionInput = {
      id: original.id,
      subject: 'Science',
      topic: 'Physics',
      content: 'What is force?',
    };

    const updated = await updateQuestion(input);

    expect(updated.id).toBe(original.id);
    expect(updated.subject).toBe('Science');
    expect(updated.topic).toBe('Physics');
    expect(updated.content).toBe('What is force?');
    // created_at should be a Date instance
    expect(updated.created_at).toBeInstanceOf(Date);
  });

  it('updates only provided fields, leaving others unchanged', async () => {
    const original = await insertQuestion({
      subject: 'History',
      topic: 'World War II',
      content: 'When did it end?',
    });

    const input: UpdateQuestionInput = {
      id: original.id,
      subject: 'Geography', // only change subject
    };

    const updated = await updateQuestion(input);

    expect(updated.id).toBe(original.id);
    expect(updated.subject).toBe('Geography');
    expect(updated.topic).toBe(original.topic);
    expect(updated.content).toBe(original.content);
    expect(updated.created_at).toBeInstanceOf(Date);
  });
});
