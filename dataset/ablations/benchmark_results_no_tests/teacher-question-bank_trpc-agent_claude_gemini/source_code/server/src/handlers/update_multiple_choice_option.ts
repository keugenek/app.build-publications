import { db } from '../db';
import { multipleChoiceOptionsTable } from '../db/schema';
import { type UpdateMultipleChoiceOptionInput, type MultipleChoiceOption } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMultipleChoiceOption = async (input: UpdateMultipleChoiceOptionInput): Promise<MultipleChoiceOption> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof multipleChoiceOptionsTable.$inferInsert> = {};
    
    if (input.option_text !== undefined) {
      updateData.option_text = input.option_text;
    }
    
    if (input.is_correct !== undefined) {
      updateData.is_correct = input.is_correct;
    }

    // Update the multiple choice option
    const result = await db.update(multipleChoiceOptionsTable)
      .set(updateData)
      .where(eq(multipleChoiceOptionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Multiple choice option with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Multiple choice option update failed:', error);
    throw error;
  }
};
