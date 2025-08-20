import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';
import { gte, lte, and } from 'drizzle-orm';

export const getWeeklyChores = async (weekStartDate?: Date): Promise<Chore[]> => {
  try {
    // Calculate week start date (defaults to current week start)
    const startDate = weekStartDate || getWeekStart(new Date());
    
    // Calculate week end date (6 days after start)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999); // End of day

    // Query chores within the week range
    const results = await db.select()
      .from(choresTable)
      .where(
        and(
          gte(choresTable.assigned_date, startDate),
          lte(choresTable.assigned_date, endDate)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get weekly chores:', error);
    throw error;
  }
};

// Helper function to get the start of the week (Monday)
function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  
  // Calculate days to subtract to get to Monday (day 1)
  // If Sunday (0), subtract 6 days; otherwise subtract (dayOfWeek - 1)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  weekStart.setDate(weekStart.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0); // Start of day
  
  return weekStart;
}
