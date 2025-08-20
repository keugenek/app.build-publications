import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type UpdateDailyMetricsInput, type DailyMetrics } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDailyMetrics = async (input: UpdateDailyMetricsInput): Promise<DailyMetrics> => {
  try {
    // First, check if the metrics entry exists
    const existing = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Daily metrics with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.sleep_duration !== undefined) {
      updateData.sleep_duration = input.sleep_duration;
    }
    if (input.work_hours !== undefined) {
      updateData.work_hours = input.work_hours;
    }
    if (input.social_interaction_time !== undefined) {
      updateData.social_interaction_time = input.social_interaction_time;
    }
    if (input.screen_time !== undefined) {
      updateData.screen_time = input.screen_time;
    }
    if (input.emotional_energy_level !== undefined) {
      updateData.emotional_energy_level = input.emotional_energy_level;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the record
    const result = await db.update(dailyMetricsTable)
      .set(updateData)
      .where(eq(dailyMetricsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and ensure proper date type
    const updatedMetrics = result[0];
    return {
      ...updatedMetrics,
      date: new Date(updatedMetrics.date), // Convert string date to Date object
      sleep_duration: parseFloat(updatedMetrics.sleep_duration as any),
      work_hours: parseFloat(updatedMetrics.work_hours as any),
      social_interaction_time: parseFloat(updatedMetrics.social_interaction_time as any),
      screen_time: parseFloat(updatedMetrics.screen_time as any)
    };
  } catch (error) {
    console.error('Daily metrics update failed:', error);
    throw error;
  }
};
