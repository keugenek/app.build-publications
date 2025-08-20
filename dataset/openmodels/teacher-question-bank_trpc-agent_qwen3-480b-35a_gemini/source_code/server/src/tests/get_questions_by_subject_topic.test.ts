import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GetQuestionsBySubjectTopicInput } from '../schema';
import { getQuestionsBySubjectTopic } from '../handlers/get_questions_by_subject_topic';
import { eq } from 'drizzle-orm';

describe('getQuestionsBySubjectTopic', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(questionsTable).values([
      {
        question_text: 'What is the capital of France?',
        subject: 'Geography',
        topic: 'European Capitals',
        answer: 'Paris',
      },
      {
        question_text: 'What is the capital of Germany?',
        subject: 'Geography',
        topic: 'European Capitals',
        answer: 'Berlin',
      },
      {
        question_text: 'What is 2+2?',
        subject: 'Math',
        topic: 'Basic Arithmetic',
        answer: '4',
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch questions filtered by subject and topic', async () => {
    const input: GetQuestionsBySubjectTopicInput = {
      subject: 'Geography',
      topic: 'European Capitals'
    };

    const result = await getQuestionsBySubjectTopic(input);

    expect(result).toHaveLength(2);
    expect(result[0].subject).toEqual('Geography');
    expect(result[0].topic).toEqual('European Capitals');
    expect(result[1].subject).toEqual('Geography');
    expect(result[1].topic).toEqual('European Capitals');
  });

  it('should return empty array when no questions match the filters', async () => {
    const input: GetQuestionsBySubjectTopicInput = {
      subject: 'NonExistentSubject',
      topic: 'NonExistentTopic'
    };

    const result = await getQuestionsBySubjectTopic(input);

    expect(result).toHaveLength(0);
  });

  it('should save questions to database and fetch them correctly', async () => {
    // Insert additional test question
    await db.insert(questionsTable).values({
      question_text: 'What is the capital of Italy?',
      subject: 'Geography',
      topic: 'European Capitals',
      answer: 'Rome',
    }).execute();

    const input: GetQuestionsBySubjectTopicInput = {
      subject: 'Geography',
      topic: 'European Capitals'
    };

    const result = await getQuestionsBySubjectTopic(input);

    expect(result).toHaveLength(3);
    
    // Verify all questions have the correct subject and topic
    result.forEach(question => {
      expect(question.subject).toEqual('Geography');
      expect(question.topic).toEqual('European Capitals');
    });

    // Verify specific question exists
    const romeQuestion = result.find(q => q.question_text.includes('Italy'));
    expect(romeQuestion).toBeDefined();
    expect(romeQuestion?.answer).toEqual('Rome');
  });
});
