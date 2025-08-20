import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type UpdatePomodoroSessionInput, type PomodoroSession } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updatePomodoroSession = async (input: UpdatePomodoroSessionInput): Promise<PomodoroSession> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: sql`NOW()` // Always update the timestamp
    };

    if (input.work_duration !== undefined) {
      updateData.work_duration = input.work_duration;
    }
    if (input.short_break_duration !== undefined) {
      updateData.short_break_duration = input.short_break_duration;
    }
    if (input.long_break_duration !== undefined) {
      updateData.long_break_duration = input.long_break_duration;
    }
    if (input.long_break_interval !== undefined) {
      updateData.long_break_interval = input.long_break_interval;
    }

    // Update the session
    const result = await db.update(pomodoroSessionsTable)
      .set(updateData)
      .where(eq(pomodoroSessionsTable.id, input.id))
      .returning()
      .execute();

    // Check if session was found and updated
    if (result.length === 0) {
      throw new Error(`Pomodoro session with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Pomodoro session update failed:', error);
    throw error;
  }
};
