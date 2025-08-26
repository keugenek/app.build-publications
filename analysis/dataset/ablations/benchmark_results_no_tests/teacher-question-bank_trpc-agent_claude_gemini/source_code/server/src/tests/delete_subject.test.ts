import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { deleteSubject } from '../handlers/delete_subject';
import { eq } from 'drizzle-orm';

describe('deleteSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing subject', async () => {
    // Create a test subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Delete the subject
    const result = await deleteSubject(subject.id);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the subject was actually deleted from the database
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject.id))
      .execute();

    expect(subjects).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent subject', async () => {
    // Try to delete a subject that doesn't exist
    const result = await deleteSubject(999);

    // Verify the result indicates failure
    expect(result.success).toBe(false);
  });

  it('should cascade delete related topics when subject is deleted', async () => {
    // Create a test subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create a topic related to the subject
    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Delete the subject
    const result = await deleteSubject(subject.id);

    // Verify the subject was deleted
    expect(result.success).toBe(true);

    // Verify the related topic was also deleted (cascade)
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(topics).toHaveLength(0);

    // Verify no topics exist for the deleted subject
    const subjectTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subject.id))
      .execute();

    expect(subjectTopics).toHaveLength(0);
  });

  it('should cascade delete related questions when subject is deleted', async () => {
    // Create a test subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create a topic for the subject
    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create a question related to the subject and topic
    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    // Delete the subject
    const result = await deleteSubject(subject.id);

    // Verify the subject was deleted
    expect(result.success).toBe(true);

    // Verify the related question was also deleted (cascade)
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify no questions exist for the deleted subject
    const subjectQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subject.id))
      .execute();

    expect(subjectQuestions).toHaveLength(0);
  });

  it('should cascade delete multiple choice options when subject is deleted', async () => {
    // Create a test subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create a topic for the subject
    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create a multiple-choice question
    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    // Create multiple choice options for the question
    const [option1] = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: question.id,
        option_text: '3',
        is_correct: false
      })
      .returning()
      .execute();

    const [option2] = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: question.id,
        option_text: '4',
        is_correct: true
      })
      .returning()
      .execute();

    // Delete the subject
    const result = await deleteSubject(subject.id);

    // Verify the subject was deleted
    expect(result.success).toBe(true);

    // Verify the multiple choice options were also deleted (cascade)
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, question.id))
      .execute();

    expect(options).toHaveLength(0);
  });

  it('should not affect other subjects when deleting one subject', async () => {
    // Create two test subjects
    const [subject1] = await db.insert(subjectsTable)
      .values({
        name: 'Subject 1',
        description: 'First subject'
      })
      .returning()
      .execute();

    const [subject2] = await db.insert(subjectsTable)
      .values({
        name: 'Subject 2',
        description: 'Second subject'
      })
      .returning()
      .execute();

    // Create topics for both subjects
    await db.insert(topicsTable)
      .values({
        name: 'Topic 1',
        description: 'Topic for subject 1',
        subject_id: subject1.id
      })
      .execute();

    await db.insert(topicsTable)
      .values({
        name: 'Topic 2',
        description: 'Topic for subject 2',
        subject_id: subject2.id
      })
      .execute();

    // Delete only the first subject
    const result = await deleteSubject(subject1.id);

    // Verify the deletion was successful
    expect(result.success).toBe(true);

    // Verify subject1 was deleted
    const deletedSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject1.id))
      .execute();

    expect(deletedSubjects).toHaveLength(0);

    // Verify subject2 still exists
    const remainingSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject2.id))
      .execute();

    expect(remainingSubjects).toHaveLength(1);
    expect(remainingSubjects[0].name).toBe('Subject 2');

    // Verify topic for subject2 still exists
    const remainingTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subject2.id))
      .execute();

    expect(remainingTopics).toHaveLength(1);
    expect(remainingTopics[0].name).toBe('Topic 2');
  });
});
