import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { getQuestionById } from '../handlers/get_question_by_id';

describe('getQuestionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a multiple-choice question with options', async () => {
    // Create prerequisite data
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'Math', description: 'Mathematics' })
      .returning()
      .execute();

    const topics = await db.insert(topicsTable)
      .values({ name: 'Algebra', description: 'Basic algebra', subject_id: subjects[0].id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subjects[0].id,
        topic_id: topics[0].id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    const questionId = questions[0].id;

    // Create multiple choice options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        { question_id: questionId, option_text: '3', is_correct: false },
        { question_id: questionId, option_text: '4', is_correct: true },
        { question_id: questionId, option_text: '5', is_correct: false }
      ])
      .execute();

    const result = await getQuestionById(questionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('What is 2 + 2?');
    expect(result!.subject_id).toEqual(subjects[0].id);
    expect(result!.topic_id).toEqual(topics[0].id);
    expect(result!.type).toEqual('multiple-choice');
    expect(result!.answer).toEqual('4');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Check options
    expect(result!.options).toBeDefined();
    expect(result!.options).toHaveLength(3);
    
    const correctOption = result!.options!.find(opt => opt.is_correct);
    expect(correctOption).toBeDefined();
    expect(correctOption!.option_text).toEqual('4');
    
    const incorrectOptions = result!.options!.filter(opt => !opt.is_correct);
    expect(incorrectOptions).toHaveLength(2);
    expect(incorrectOptions.map(opt => opt.option_text).sort()).toEqual(['3', '5']);
  });

  it('should return a non-multiple-choice question without options', async () => {
    // Create prerequisite data
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'History', description: 'World history' })
      .returning()
      .execute();

    const topics = await db.insert(topicsTable)
      .values({ name: 'Ancient Rome', description: 'Roman Empire history', subject_id: subjects[0].id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'Who was the first emperor of Rome?',
        subject_id: subjects[0].id,
        topic_id: topics[0].id,
        type: 'short-answer',
        answer: 'Augustus'
      })
      .returning()
      .execute();

    const questionId = questions[0].id;

    const result = await getQuestionById(questionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('Who was the first emperor of Rome?');
    expect(result!.type).toEqual('short-answer');
    expect(result!.answer).toEqual('Augustus');
    expect(result!.options).toBeUndefined();
  });

  it('should return a true-false question without options', async () => {
    // Create prerequisite data
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'Science', description: 'General science' })
      .returning()
      .execute();

    const topics = await db.insert(topicsTable)
      .values({ name: 'Physics', description: 'Basic physics', subject_id: subjects[0].id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'Light travels faster than sound.',
        subject_id: subjects[0].id,
        topic_id: topics[0].id,
        type: 'true-false',
        answer: 'true'
      })
      .returning()
      .execute();

    const questionId = questions[0].id;

    const result = await getQuestionById(questionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('Light travels faster than sound.');
    expect(result!.type).toEqual('true-false');
    expect(result!.answer).toEqual('true');
    expect(result!.options).toBeUndefined();
  });

  it('should return null for non-existent question', async () => {
    const result = await getQuestionById(9999);

    expect(result).toBeNull();
  });

  it('should return multiple-choice question with empty options array when no options exist', async () => {
    // Create prerequisite data
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'English', description: 'English language' })
      .returning()
      .execute();

    const topics = await db.insert(topicsTable)
      .values({ name: 'Grammar', description: 'English grammar', subject_id: subjects[0].id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'Choose the correct verb form.',
        subject_id: subjects[0].id,
        topic_id: topics[0].id,
        type: 'multiple-choice',
        answer: 'was'
      })
      .returning()
      .execute();

    const questionId = questions[0].id;

    // Don't create any options for this multiple-choice question

    const result = await getQuestionById(questionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.type).toEqual('multiple-choice');
    expect(result!.options).toBeUndefined(); // Empty array becomes undefined
  });

  it('should handle open-ended questions correctly', async () => {
    // Create prerequisite data
    const subjects = await db.insert(subjectsTable)
      .values({ name: 'Literature', description: 'English literature' })
      .returning()
      .execute();

    const topics = await db.insert(topicsTable)
      .values({ name: 'Poetry', description: 'Poetry analysis', subject_id: subjects[0].id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values({
        question_text: 'Analyze the theme of love in Shakespeare\'s sonnets.',
        subject_id: subjects[0].id,
        topic_id: topics[0].id,
        type: 'open-ended',
        answer: 'Sample analysis of love themes in Shakespeare\'s work.'
      })
      .returning()
      .execute();

    const questionId = questions[0].id;

    const result = await getQuestionById(questionId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(questionId);
    expect(result!.question_text).toEqual('Analyze the theme of love in Shakespeare\'s sonnets.');
    expect(result!.type).toEqual('open-ended');
    expect(result!.answer).toEqual('Sample analysis of love themes in Shakespeare\'s work.');
    expect(result!.options).toBeUndefined();
  });
});
