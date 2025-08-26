import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // First, check if the question exists
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (existingQuestion.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // If subject_id or topic_id are being updated, validate they exist and are related
    if (input.subject_id || input.topic_id) {
      const targetSubjectId = input.subject_id || existingQuestion[0].subject_id;
      const targetTopicId = input.topic_id || existingQuestion[0].topic_id;

      // Check if subject exists
      const subjectExists = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, targetSubjectId))
        .execute();

      if (subjectExists.length === 0) {
        throw new Error(`Subject with id ${targetSubjectId} not found`);
      }

      // Check if topic exists and belongs to the subject
      const topicExists = await db.select()
        .from(topicsTable)
        .where(and(
          eq(topicsTable.id, targetTopicId),
          eq(topicsTable.subject_id, targetSubjectId)
        ))
        .execute();

      if (topicExists.length === 0) {
        throw new Error(`Topic with id ${targetTopicId} not found or does not belong to subject ${targetSubjectId}`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.question_text !== undefined) {
      updateData.question_text = input.question_text;
    }
    if (input.option_a !== undefined) {
      updateData.option_a = input.option_a;
    }
    if (input.option_b !== undefined) {
      updateData.option_b = input.option_b;
    }
    if (input.option_c !== undefined) {
      updateData.option_c = input.option_c;
    }
    if (input.option_d !== undefined) {
      updateData.option_d = input.option_d;
    }
    if (input.correct_answer !== undefined) {
      updateData.correct_answer = input.correct_answer;
    }
    if (input.explanation !== undefined) {
      updateData.explanation = input.explanation;
    }
    if (input.difficulty_level !== undefined) {
      updateData.difficulty_level = input.difficulty_level;
    }
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }
    if (input.topic_id !== undefined) {
      updateData.topic_id = input.topic_id;
    }

    // Perform the update
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
