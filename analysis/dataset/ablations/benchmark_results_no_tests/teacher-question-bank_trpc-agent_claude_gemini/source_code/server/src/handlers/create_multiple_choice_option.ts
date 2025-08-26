import { db } from '../db';
import { multipleChoiceOptionsTable, questionsTable } from '../db/schema';
import { type CreateMultipleChoiceOptionInput, type MultipleChoiceOption } from '../schema';
import { eq } from 'drizzle-orm';

export const createMultipleChoiceOption = async (input: CreateMultipleChoiceOptionInput): Promise<MultipleChoiceOption> => {
  try {
    // First validate that the question exists and is of type 'multiple-choice'
    const question = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.question_id))
      .execute();

    if (question.length === 0) {
      throw new Error(`Question with id ${input.question_id} not found`);
    }

    if (question[0].type !== 'multiple-choice') {
      throw new Error(`Question with id ${input.question_id} is not a multiple-choice question`);
    }

    // Insert the multiple choice option
    const result = await db.insert(multipleChoiceOptionsTable)
      .values({
        question_id: input.question_id,
        option_text: input.option_text,
        is_correct: input.is_correct
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Multiple choice option creation failed:', error);
    throw error;
  }
};
