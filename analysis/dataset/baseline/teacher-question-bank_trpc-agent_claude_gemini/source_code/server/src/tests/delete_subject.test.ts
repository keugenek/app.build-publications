import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteSubject } from '../handlers/delete_subject';
import { eq } from 'drizzle-orm';

describe('deleteSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing subject', async () => {
    // Create a test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing deletion'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;
    const input: DeleteInput = { id: subjectId };

    // Delete the subject
    const result = await deleteSubject(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify subject no longer exists in database
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();

    expect(subjects).toHaveLength(0);
  });

  it('should return false when deleting non-existent subject', async () => {
    const input: DeleteInput = { id: 999 }; // Non-existent ID

    const result = await deleteSubject(input);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should cascade delete related topics and questions', async () => {
    // Create a test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Physics',
        description: 'Science subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create a topic for this subject
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Mechanics',
        description: 'Physics mechanics topic',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Create a question for this subject and topic
    await db.insert(questionsTable)
      .values({
        question_text: 'What is Newton\'s first law?',
        option_a: 'Objects at rest stay at rest',
        option_b: 'Force equals mass times acceleration',
        option_c: 'Every action has an equal reaction',
        option_d: 'Energy cannot be created or destroyed',
        correct_answer: 'A',
        explanation: 'Newton\'s first law states that objects at rest stay at rest',
        difficulty_level: 'medium',
        subject_id: subjectId,
        topic_id: topicId
      })
      .execute();

    // Verify initial data exists
    const initialTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();
    expect(initialTopics).toHaveLength(1);

    const initialQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();
    expect(initialQuestions).toHaveLength(1);

    // Delete the subject
    const input: DeleteInput = { id: subjectId };
    const result = await deleteSubject(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify subject is deleted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();
    expect(subjects).toHaveLength(0);

    // Verify related topics are cascade deleted
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();
    expect(topics).toHaveLength(0);

    // Verify related questions are cascade deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();
    expect(questions).toHaveLength(0);
  });

  it('should preserve other subjects when deleting one', async () => {
    // Create two test subjects
    const subject1Result = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const subject2Result = await db.insert(subjectsTable)
      .values({
        name: 'Chemistry',
        description: 'Chemistry subject'
      })
      .returning()
      .execute();

    const subject1Id = subject1Result[0].id;
    const subject2Id = subject2Result[0].id;

    // Delete the first subject
    const input: DeleteInput = { id: subject1Id };
    const result = await deleteSubject(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify first subject is deleted
    const deletedSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject1Id))
      .execute();
    expect(deletedSubjects).toHaveLength(0);

    // Verify second subject still exists
    const remainingSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subject2Id))
      .execute();
    expect(remainingSubjects).toHaveLength(1);
    expect(remainingSubjects[0].name).toBe('Chemistry');
  });

  it('should handle deletion with multiple topics and questions', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Biology',
        description: 'Life sciences'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create multiple topics
    const topic1Result = await db.insert(topicsTable)
      .values({
        name: 'Cell Biology',
        description: 'Study of cells',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topic2Result = await db.insert(topicsTable)
      .values({
        name: 'Genetics',
        description: 'Study of genes',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topic1Id = topic1Result[0].id;
    const topic2Id = topic2Result[0].id;

    // Create multiple questions
    await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is the powerhouse of the cell?',
          option_a: 'Nucleus',
          option_b: 'Mitochondria',
          option_c: 'Ribosome',
          option_d: 'Lysosome',
          correct_answer: 'B',
          explanation: 'Mitochondria produce ATP',
          difficulty_level: 'easy',
          subject_id: subjectId,
          topic_id: topic1Id
        },
        {
          question_text: 'What does DNA stand for?',
          option_a: 'Deoxyribonucleic Acid',
          option_b: 'Ribonucleic Acid',
          option_c: 'Amino Acid',
          option_d: 'Fatty Acid',
          correct_answer: 'A',
          explanation: 'DNA is deoxyribonucleic acid',
          difficulty_level: 'medium',
          subject_id: subjectId,
          topic_id: topic2Id
        }
      ])
      .execute();

    // Verify initial data count
    const initialTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();
    expect(initialTopics).toHaveLength(2);

    const initialQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();
    expect(initialQuestions).toHaveLength(2);

    // Delete the subject
    const input: DeleteInput = { id: subjectId };
    const result = await deleteSubject(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify all related data is cascade deleted
    const finalTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();
    expect(finalTopics).toHaveLength(0);

    const finalQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();
    expect(finalQuestions).toHaveLength(0);
  });
});
