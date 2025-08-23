import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type UpdatePomodoroSessionInput, type PomodoroSession } from '../schema';
import { type NewPomodoroSession } from '../db/schema';

/**
 * Updates an existing pomodoro session.
 * Allows updating `ended_at` and `completed` fields.
 * Throws an error if the session does not exist.
 */
export const updatePomodoroSession = async (
  input: UpdatePomodoroSessionInput,
): Promise<PomodoroSession> => {
  try {
    // Build the partial update object based on provided fields
    const updates: Partial<NewPomodoroSession> = {};
    if (input.ended_at !== undefined) {
      updates.ended_at = input.ended_at;
    }
    if (input.completed !== undefined) {
      updates.completed = input.completed;
    }

    // Perform the update
    const result = await db
      .update(pomodoroSessionsTable)
      .set(updates)
      .where(eq(pomodoroSessionsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error(`Pomodoro session with id ${input.id} not found`);
    }

    // Return the updated session (type matches schema inference)
    return updated as PomodoroSession;
  } catch (error) {
    console.error('Failed to update pomodoro session:', error);
    throw error;
  }
};
