import { type CreateProgressInput, type Progress } from '../schema';

import { db } from '../db';
import { progresses } from '../db/schema';
// No additional imports needed

// Handler for creating a progress record
export const createProgress = async (input: CreateProgressInput): Promise<Progress> => {
  try {
    // Insert progress record; numeric column needs string conversion
    const result = await db.insert(progresses)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        next_review: input.next_review,
        interval_days: input.interval_days,
        easiness_factor: input.easiness_factor.toString()
      })
      .returning()
      .execute();

    const progress = result[0];
    // Convert numeric column back to number
    return {
      ...progress,
      easiness_factor: parseFloat(progress.easiness_factor as unknown as string)
    } as Progress;
  } catch (error) {
    console.error('Progress creation failed:', error);
    throw error;
  }
};
