import { db } from '../db';
import { catsTable } from '../db/schema';
import { type UpdateCatInput, type Cat } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCat = async (input: UpdateCatInput): Promise<Cat> => {
  try {
    // Prepare update data, excluding undefined fields
    const updateData: Partial<typeof catsTable.$inferInsert> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.breed !== undefined) updateData.breed = input.breed;
    if (input.age !== undefined) updateData.age = input.age;

    // Update cat record
    const result = await db.update(catsTable)
      .set(updateData)
      .where(eq(catsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Cat with id ${input.id} not found`);
    }

    const updatedCat = result[0];
    return {
      ...updatedCat,
      created_at: new Date(updatedCat.created_at)
    };
  } catch (error) {
    console.error('Cat update failed:', error);
    throw error;
  }
};
