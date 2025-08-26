import { db } from '../db';
import { multipleChoiceOptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMultipleChoiceOption = async (id: number): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.id, id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Multiple choice option deletion failed:', error);
    throw error;
  }
};
