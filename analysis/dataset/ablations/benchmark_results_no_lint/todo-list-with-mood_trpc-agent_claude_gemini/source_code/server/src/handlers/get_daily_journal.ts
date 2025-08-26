import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetDailyJournalInput, type DailyJournalEntry } from '../schema';
import { gte, lte, and, SQL } from 'drizzle-orm';

export const getDailyJournal = async (input: GetDailyJournalInput): Promise<DailyJournalEntry[]> => {
  try {
    // Parse dates and set end_date to start_date if not provided
    const startDate = new Date(input.start_date);
    const endDate = input.end_date ? new Date(input.end_date) : startDate;
    
    // Set time boundaries for proper date filtering
    const startOfStartDate = new Date(startDate);
    startOfStartDate.setHours(0, 0, 0, 0);
    
    const endOfEndDate = new Date(endDate);
    endOfEndDate.setHours(23, 59, 59, 999);

    // Query tasks within the date range (by created_at)
    const taskConditions: SQL<unknown>[] = [
      gte(tasksTable.created_at, startOfStartDate),
      lte(tasksTable.created_at, endOfEndDate)
    ];

    const tasks = await db.select()
      .from(tasksTable)
      .where(and(...taskConditions))
      .execute();

    // Query mood entries within the date range (by entry_date)
    const moodConditions: SQL<unknown>[] = [
      gte(moodEntriesTable.entry_date, input.start_date),
      lte(moodEntriesTable.entry_date, input.end_date || input.start_date)
    ];

    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(and(...moodConditions))
      .execute();

    // Create a map to group data by date
    const dailyData = new Map<string, DailyJournalEntry>();

    // Generate all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData.set(dateStr, {
        date: dateStr,
        tasks: [],
        mood_entry: null
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group tasks by creation date
    tasks.forEach(task => {
      const taskDate = task.created_at.toISOString().split('T')[0];
      if (dailyData.has(taskDate)) {
        dailyData.get(taskDate)!.tasks.push({
          id: task.id,
          name: task.name,
          is_completed: task.is_completed,
          created_at: task.created_at,
          updated_at: task.updated_at
        });
      }
    });

    // Map mood entries by entry date
    moodEntries.forEach(mood => {
      const moodDate = mood.entry_date; // This is already a string in YYYY-MM-DD format
      if (dailyData.has(moodDate)) {
        dailyData.get(moodDate)!.mood_entry = {
          id: mood.id,
          mood_score: mood.mood_score,
          notes: mood.notes,
          entry_date: new Date(mood.entry_date), // Convert string to Date for schema compliance
          created_at: mood.created_at
        };
      }
    });

    // Convert map to array and sort by date
    return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Failed to fetch daily journal:', error);
    throw error;
  }
};
