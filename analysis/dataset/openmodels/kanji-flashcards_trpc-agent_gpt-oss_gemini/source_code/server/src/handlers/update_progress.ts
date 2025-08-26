import { db } from '../db';
import { progresses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateProgressInput, type Progress } from '../schema';

export const updateProgress = async (input: UpdateProgressInput): Promise<Progress> => {
  try {
    // Build the fields to update only if they are provided
    const updateData: Partial<typeof progresses.$inferInsert> = {};

    if (input.next_review !== undefined) {
      updateData.next_review = input.next_review;
    }
    if (input.interval_days !== undefined) {
      updateData.interval_days = input.interval_days;
    }
    if (input.easiness_factor !== undefined) {
      // numeric column expects string representation
      updateData.easiness_factor = input.easiness_factor.toString();
    }

    const result = await db
      .update(progresses)
      .set(updateData)
      .where(eq(progresses.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error('Progress record not found');
    }

    // Convert numeric column back to number
    const easinessFactor = typeof updated.easiness_factor === 'string'
      ? parseFloat(updated.easiness_factor)
      : updated.easiness_factor;

    return {
      ...updated,
      easiness_factor: easinessFactor,
    } as Progress;
  } catch (error) {
    console.error('Progress update failed:', error);
    throw error;
  }
};
