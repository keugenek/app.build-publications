import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type DeleteSubjectInput } from '../schema';
import { deleteSubject } from '../handlers/delete_subject';
import { eq } from 'drizzle-orm';

describe('deleteSubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a subject with no related data', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Delete the subject
    const input: DeleteSubjectInput = { id: subjectId };
    const result = await deleteSubject(input);

    expect(result.success).toBe(true);

    // Verify subject is deleted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();

    expect(subjects).toHaveLength(0);
  });

  it('should delete subject and cascade delete topics', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Create topics for the subject
    await db.insert(topicsTable)
      .values([
        { name: 'Topic 1', subject_id: subjectId },
        { name: 'Topic 2', subject_id: subjectId }
      ])
      .execute();

    // Verify topics exist before deletion
    const topicsBeforeDelete = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();

    expect(topicsBeforeDelete).toHaveLength(2);

    // Delete the subject
    const input: DeleteSubjectInput = { id: subjectId };
    const result = await deleteSubject(input);

    expect(result.success).toBe(true);

    // Verify subject is deleted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();

    expect(subjects).toHaveLength(0);

    // Verify topics are cascade deleted
    const topicsAfterDelete = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();

    expect(topicsAfterDelete).toHaveLength(0);
  });

  it('should delete subject and cascade delete questions and quiz associations', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Create a topic for the subject
    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Test Topic', subject_id: subjectId })
      .returning()
      .execute();
    
    const topicId = topicResult[0].id;

    // Create questions for the subject and topic
    const questionResults = await db.insert(questionsTable)
      .values([
        { text: 'Question 1', subject_id: subjectId, topic_id: topicId },
        { text: 'Question 2', subject_id: subjectId, topic_id: topicId }
      ])
      .returning()
      .execute();

    const questionIds = questionResults.map(q => q.id);

    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz' })
      .returning()
      .execute();
    
    const quizId = quizResult[0].id;

    // Add questions to the quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quizId, question_id: questionIds[0] },
        { quiz_id: quizId, question_id: questionIds[1] }
      ])
      .execute();

    // Verify data exists before deletion
    const questionsBeforeDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();

    const quizQuestionsBeforeDelete = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(questionsBeforeDelete).toHaveLength(2);
    expect(quizQuestionsBeforeDelete).toHaveLength(2);

    // Delete the subject
    const input: DeleteSubjectInput = { id: subjectId };
    const result = await deleteSubject(input);

    expect(result.success).toBe(true);

    // Verify subject is deleted
    const subjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();

    expect(subjects).toHaveLength(0);

    // Verify questions are cascade deleted
    const questionsAfterDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();

    expect(questionsAfterDelete).toHaveLength(0);

    // Verify quiz questions associations are cleaned up
    const quizQuestionsAfterDelete = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(quizQuestionsAfterDelete).toHaveLength(0);

    // Verify the quiz itself still exists (only associations were deleted)
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    expect(quizzes).toHaveLength(1);
  });

  it('should throw error when trying to delete non-existent subject', async () => {
    const input: DeleteSubjectInput = { id: 999 };

    await expect(deleteSubject(input)).rejects.toThrow(/Subject with id 999 not found/i);
  });

  it('should handle subject with complex nested relationships', async () => {
    // Create multiple subjects to ensure we only delete the targeted one
    const subjectResults = await db.insert(subjectsTable)
      .values([
        { name: 'Subject to Delete' },
        { name: 'Subject to Keep' }
      ])
      .returning()
      .execute();
    
    const subjectToDeleteId = subjectResults[0].id;
    const subjectToKeepId = subjectResults[1].id;

    // Create topics for both subjects
    const topicResults = await db.insert(topicsTable)
      .values([
        { name: 'Topic Delete 1', subject_id: subjectToDeleteId },
        { name: 'Topic Delete 2', subject_id: subjectToDeleteId },
        { name: 'Topic Keep', subject_id: subjectToKeepId }
      ])
      .returning()
      .execute();

    // Create questions for both subjects
    await db.insert(questionsTable)
      .values([
        { text: 'Question Delete 1', subject_id: subjectToDeleteId, topic_id: topicResults[0].id },
        { text: 'Question Delete 2', subject_id: subjectToDeleteId, topic_id: topicResults[1].id },
        { text: 'Question Keep', subject_id: subjectToKeepId, topic_id: topicResults[2].id }
      ])
      .execute();

    // Delete only the first subject
    const input: DeleteSubjectInput = { id: subjectToDeleteId };
    const result = await deleteSubject(input);

    expect(result.success).toBe(true);

    // Verify targeted subject and its data is deleted
    const deletedSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectToDeleteId))
      .execute();

    const deletedTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectToDeleteId))
      .execute();

    const deletedQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectToDeleteId))
      .execute();

    expect(deletedSubjects).toHaveLength(0);
    expect(deletedTopics).toHaveLength(0);
    expect(deletedQuestions).toHaveLength(0);

    // Verify the other subject and its data still exists
    const keptSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectToKeepId))
      .execute();

    const keptTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectToKeepId))
      .execute();

    const keptQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectToKeepId))
      .execute();

    expect(keptSubjects).toHaveLength(1);
    expect(keptTopics).toHaveLength(1);
    expect(keptQuestions).toHaveLength(1);
  });
});
