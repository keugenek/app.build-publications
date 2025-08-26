import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreInput, type Chore } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateChore(input: UpdateChoreInput): Promise<Chore> {
  try {
    // Build the update values object based on provided fields
    const updateValues: Partial<{
      name: string;
      description: string | null;
    }> = {};

    if (input.name !== undefined) {
      updateValues.name = input.name;
    }

    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    // Perform the update operation
    const result = await db.update(choresTable)
      .set(updateValues)
      .where(eq(choresTable.id, input.id))
      .returning()
      .execute();

    // Check if the chore was found and updated
    if (result.length === 0) {
      throw new Error(`Chore with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Chore update failed:', error);
    throw error;
  }
}
