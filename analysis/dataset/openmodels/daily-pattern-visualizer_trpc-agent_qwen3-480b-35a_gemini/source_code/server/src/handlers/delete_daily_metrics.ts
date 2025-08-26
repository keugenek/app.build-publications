import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteDailyMetrics = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, id))
      .returning()
      .execute();

    // If no rows were deleted, result will be an empty array
    return result.length > 0;
  } catch (error) {
    console.error('Delete daily metrics failed:', error);
    throw error;
  }
};
