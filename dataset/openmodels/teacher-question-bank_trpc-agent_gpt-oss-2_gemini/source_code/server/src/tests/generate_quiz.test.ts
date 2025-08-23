import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GenerateQuizInput, type Quiz } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq, and } from 'drizzle-orm';

// Helper to insert a question
const insertQuestion = async (subject: string, topic: string, content: string) => {
  await db
    .insert(questionsTable)
    .values({ subject, topic, content })
    .execute();
};

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a quiz with the requested number of matching questions', async () => {
    // Insert 5 matching questions and 2 non-matching
    await Promise.all([
      insertQuestion('Math', 'Algebra', 'What is x?'),
      insertQuestion('Math', 'Algebra', 'Solve for y.'),
      insertQuestion('Math', 'Algebra', 'Factor the equation.'),
      insertQuestion('Math', 'Algebra', 'Graph the line.'),
      insertQuestion('Math', 'Algebra', 'Calculate the derivative.'),
      insertQuestion('Science', 'Biology', 'What is a cell?'),
      insertQuestion('Math', 'Geometry', 'What is a triangle?'),
    ]);

    const input: GenerateQuizInput = { subject: 'Math', topic: 'Algebra', count: 3 };
    const quiz: Quiz = await generateQuiz(input);

    // Verify basic quiz fields
    expect(quiz.subject).toBe('Math');
    expect(quiz.topic).toBe('Algebra');
    expect(quiz.questions).toHaveLength(3);
    // All questions should match subject and topic
    quiz.questions.forEach((q) => {
      expect(q.subject).toBe('Math');
      expect(q.topic).toBe('Algebra');
    });
  });

  it('should return all available questions if count exceeds the number of matches', async () => {
    await insertQuestion('History', 'World War II', 'When did it start?');
    await insertQuestion('History', 'World War II', 'Who were the allies?');

    const input: GenerateQuizInput = { subject: 'History', topic: 'World War II', count: 5 };
    const quiz = await generateQuiz(input);
    expect(quiz.questions).toHaveLength(2);
    quiz.questions.forEach((q) => {
      expect(q.subject).toBe('History');
      expect(q.topic).toBe('World War II');
    });
  });
});
