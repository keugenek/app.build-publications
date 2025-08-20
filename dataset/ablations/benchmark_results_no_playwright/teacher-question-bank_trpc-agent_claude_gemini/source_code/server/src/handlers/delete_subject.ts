import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { type DeleteSubjectInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteSubject(input: DeleteSubjectInput): Promise<{ success: boolean }> {
  try {
    // First, check if the subject exists
    const existingSubjects = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.id))
      .execute();

    if (existingSubjects.length === 0) {
      throw new Error(`Subject with id ${input.id} not found`);
    }

    // Get all questions related to this subject to handle quiz_questions cleanup
    const relatedQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, input.id))
      .execute();

    const questionIds = relatedQuestions.map(q => q.id);

    // Delete quiz_questions entries for questions related to this subject
    if (questionIds.length > 0) {
      for (const questionId of questionIds) {
        await db.delete(quizQuestionsTable)
          .where(eq(quizQuestionsTable.question_id, questionId))
          .execute();
      }
    }

    // Delete questions related to this subject
    await db.delete(questionsTable)
      .where(eq(questionsTable.subject_id, input.id))
      .execute();

    // Delete topics related to this subject
    await db.delete(topicsTable)
      .where(eq(topicsTable.subject_id, input.id))
      .execute();

    // Finally, delete the subject itself
    await db.delete(subjectsTable)
      .where(eq(subjectsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Subject deletion failed:', error);
    throw error;
  }
}
