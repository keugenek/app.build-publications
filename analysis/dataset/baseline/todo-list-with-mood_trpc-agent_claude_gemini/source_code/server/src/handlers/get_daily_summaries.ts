import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type DailySummary, type DateRangeInput } from '../schema';
import { eq, gte, lte, desc, and, SQL } from 'drizzle-orm';

export const getDailySummaries = async (dateRange?: DateRangeInput): Promise<DailySummary[]> => {
  try {
    // Determine date range - default to last 30 days if not provided
    const endDate = dateRange?.end_date ? new Date(dateRange.end_date) : new Date();
    const startDate = dateRange?.start_date 
      ? new Date(dateRange.start_date) 
      : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    // Set end date to end of day for proper range filtering
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    // Query all tasks in the date range
    const taskConditions: SQL<unknown>[] = [];
    taskConditions.push(gte(tasksTable.created_at, startDate));
    taskConditions.push(lte(tasksTable.created_at, endDate));

    const tasksQuery = db.select()
      .from(tasksTable)
      .where(and(...taskConditions))
      .orderBy(desc(tasksTable.created_at));

    const tasks = await tasksQuery.execute();

    // Query all mood entries in the date range
    const moodConditions: SQL<unknown>[] = [];
    moodConditions.push(gte(moodEntriesTable.date, startDate.toISOString().split('T')[0]));
    moodConditions.push(lte(moodEntriesTable.date, endDate.toISOString().split('T')[0]));

    const moodQuery = db.select()
      .from(moodEntriesTable)
      .where(and(...moodConditions));

    const moodEntries = await moodQuery.execute();

    // Create a map to group data by date
    const summariesMap = new Map<string, DailySummary>();

    // Initialize date range with empty summaries
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      summariesMap.set(dateKey, {
        date: new Date(currentDate),
        completed_tasks: [],
        mood_entry: null,
        total_tasks: 0,
        completed_tasks_count: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process tasks
    tasks.forEach(task => {
      const taskDate = task.created_at.toISOString().split('T')[0];
      const summary = summariesMap.get(taskDate);
      
      if (summary) {
        summary.total_tasks++;
        
        if (task.is_completed) {
          summary.completed_tasks_count++;
          summary.completed_tasks.push({
            id: task.id,
            title: task.title,
            description: task.description,
            is_completed: task.is_completed,
            created_at: task.created_at,
            completed_at: task.completed_at,
          });
        }
      }
    });

    // Process mood entries
    moodEntries.forEach(mood => {
      const moodDate = mood.date;
      const summary = summariesMap.get(moodDate);
      
      if (summary) {
        summary.mood_entry = {
          id: mood.id,
          mood_rating: mood.mood_rating,
          note: mood.note,
          date: new Date(mood.date),
          created_at: mood.created_at,
        };
      }
    });

    // Convert map to array and sort by date (newest first)
    const summaries = Array.from(summariesMap.values())
      .filter(summary => summary.total_tasks > 0 || summary.mood_entry !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return summaries;
  } catch (error) {
    console.error('Failed to fetch daily summaries:', error);
    throw error;
  }
};
