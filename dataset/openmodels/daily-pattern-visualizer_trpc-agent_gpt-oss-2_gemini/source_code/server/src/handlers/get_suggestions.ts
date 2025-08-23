import { type GetSuggestionsInput, type DailyMetrics } from '../schema';
import { gte } from 'drizzle-orm';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';

/**
 * Placeholder handler for generating suggestions based on thresholds.
 * In a real implementation this would analyse stored metrics and return advice.
 */
export async function getSuggestions(input: GetSuggestionsInput): Promise<string[]> {
  const suggestions: string[] = [];
  // Check work hours threshold against stored metrics
  if (input.workHoursThreshold !== undefined) {
    const workResults = await db
      .select()
      .from(dailyMetricsTable)
      .where(gte(dailyMetricsTable.work_hours, input.workHoursThreshold.toString()))
      .execute();
    if (workResults.length > 0) {
      suggestions.push(`Consider taking a break after ${input.workHoursThreshold} hours of work.`);
    }
  }

  // Check screen time threshold against stored metrics
  if (input.screenTimeThreshold !== undefined) {
    const screenResults = await db
      .select()
      .from(dailyMetricsTable)
      .where(gte(dailyMetricsTable.screen_time, input.screenTimeThreshold.toString()))
      .execute();
    if (screenResults.length > 0) {
      suggestions.push(`Consider taking a break after ${input.screenTimeThreshold} hours of screen time.`);
    }
  }

  // Default suggestion if none triggered
  if (suggestions.length === 0) {
    suggestions.push('All metrics look good. Keep up the good work!');
  }
  return suggestions;
}
