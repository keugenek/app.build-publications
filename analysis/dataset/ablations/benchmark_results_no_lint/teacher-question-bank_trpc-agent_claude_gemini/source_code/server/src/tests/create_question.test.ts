import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQuestionInput = {
  question_text: 'What is the capital of France?',
  answer_text: 'Paris',
  subject_id: 1,
  topic_id: 1
};

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a question', async () => {
    // Create prerequisite subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Geography',
        description: 'World Geography'
      })
      .returning()
      .execute();

    // Create prerequisite topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'European Capitals',
        description: 'Capital cities of European countries',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    // Update test input with actual IDs
    const input = {
      ...testInput,
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    };

    const result = await createQuestion(input);

    // Basic field validation
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.answer_text).toEqual('Paris');
    expect(result.subject_id).toEqual(subjectResult[0].id);
    expect(result.topic_id).toEqual(topicResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'General Science'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Physics',
        description: 'Basic Physics',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      question_text: 'What is Newton\'s first law?',
      answer_text: 'An object at rest stays at rest unless acted upon by a force',
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    };

    const result = await createQuestion(input);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].question_text).toEqual('What is Newton\'s first law?');
    expect(questions[0].answer_text).toEqual('An object at rest stays at rest unless acted upon by a force');
    expect(questions[0].subject_id).toEqual(subjectResult[0].id);
    expect(questions[0].topic_id).toEqual(topicResult[0].id);
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraints', async () => {
    // Test with non-existent subject_id and topic_id
    const invalidInput = {
      ...testInput,
      subject_id: 999,
      topic_id: 999
    };

    await expect(createQuestion(invalidInput))
      .rejects
      .toThrow(/violates foreign key constraint|foreign key/i);
  });

  it('should create multiple questions for same subject and topic', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Basic Mathematics'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic Algebra',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    // Create first question
    const input1 = {
      question_text: 'What is 2 + 2?',
      answer_text: '4',
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    };

    // Create second question
    const input2 = {
      question_text: 'What is 3 * 5?',
      answer_text: '15',
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    };

    const result1 = await createQuestion(input1);
    const result2 = await createQuestion(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.subject_id).toEqual(result2.subject_id);
    expect(result1.topic_id).toEqual(result2.topic_id);

    // Verify both questions exist in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectResult[0].id))
      .execute();

    expect(questions).toHaveLength(2);
  });

  it('should handle long text content', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Literature',
        description: 'English Literature'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Shakespeare',
        description: 'Works of William Shakespeare',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const longQuestionText = 'In Shakespeare\'s "Romeo and Juliet", what are the names of the two feuding families, and in which Italian city does the story take place? Additionally, explain the significance of the balcony scene and how it represents the central theme of forbidden love in the play.';
    const longAnswerText = 'The two feuding families are the Montagues and the Capulets, and the story takes place in Verona, Italy. The balcony scene is significant because it represents the pure, innocent love between Romeo and Juliet that exists despite their families\' hatred. It symbolizes their attempt to transcend the social barriers and family feuds that separate them, highlighting the theme of love conquering hate, even though ultimately their love leads to tragedy.';

    const input = {
      question_text: longQuestionText,
      answer_text: longAnswerText,
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    };

    const result = await createQuestion(input);

    expect(result.question_text).toEqual(longQuestionText);
    expect(result.answer_text).toEqual(longAnswerText);
    expect(result.question_text.length).toBeGreaterThan(100);
    expect(result.answer_text.length).toBeGreaterThan(200);
  });
});
