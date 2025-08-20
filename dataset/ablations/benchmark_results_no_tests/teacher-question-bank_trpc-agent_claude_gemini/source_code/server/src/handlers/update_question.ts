import { db } from '../db';
import { questionsTable, multipleChoiceOptionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type QuestionWithOptions } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<QuestionWithOptions> => {
  try {
    // If updating subject_id or topic_id, validate they exist and are related
    if (input.subject_id !== undefined || input.topic_id !== undefined) {
      // Get current question to check existing IDs if not being updated
      const currentQuestion = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, input.id))
        .execute();

      if (currentQuestion.length === 0) {
        throw new Error('Question not found');
      }

      const subjectId = input.subject_id ?? currentQuestion[0].subject_id;
      const topicId = input.topic_id ?? currentQuestion[0].topic_id;

      // Verify subject exists
      const subject = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, subjectId))
        .execute();

      if (subject.length === 0) {
        throw new Error('Subject not found');
      }

      // Verify topic exists and belongs to the subject
      const topic = await db.select()
        .from(topicsTable)
        .where(and(
          eq(topicsTable.id, topicId),
          eq(topicsTable.subject_id, subjectId)
        ))
        .execute();

      if (topic.length === 0) {
        throw new Error('Topic not found or does not belong to the specified subject');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.question_text !== undefined) {
      updateData.question_text = input.question_text;
    }
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }
    if (input.topic_id !== undefined) {
      updateData.topic_id = input.topic_id;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.answer !== undefined) {
      updateData.answer = input.answer;
    }

    // Update the question
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Question not found');
    }

    const updatedQuestion = result[0];

    // Get multiple choice options if it's a multiple-choice question
    let options: any[] | undefined;
    if (updatedQuestion.type === 'multiple-choice') {
      options = await db.select()
        .from(multipleChoiceOptionsTable)
        .where(eq(multipleChoiceOptionsTable.question_id, updatedQuestion.id))
        .execute();
    }

    return {
      ...updatedQuestion,
      options
    };
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
