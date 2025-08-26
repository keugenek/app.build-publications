import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetHistoricalEntriesInput, type DailyEntry } from '../schema';
import { sql, eq, gte, lte, and, desc, SQL } from 'drizzle-orm';

export async function getHistoricalEntries(input: GetHistoricalEntriesInput): Promise<DailyEntry[]> {
  try {
    // Get tasks - use separate query paths to avoid TypeScript issues
    let tasks;
    if (input.start_date || input.end_date) {
      const taskConditions: SQL<unknown>[] = [];
      if (input.start_date) {
        taskConditions.push(gte(sql`DATE(${tasksTable.created_at})`, input.start_date));
      }
      if (input.end_date) {
        taskConditions.push(lte(sql`DATE(${tasksTable.created_at})`, input.end_date));
      }
      
      const whereCondition = taskConditions.length === 1 ? taskConditions[0] : and(...taskConditions);
      tasks = await db.select().from(tasksTable).where(whereCondition).execute();
    } else {
      tasks = await db.select().from(tasksTable).execute();
    }

    // Get mood entries - use separate query paths to avoid TypeScript issues
    let moodEntries;
    if (input.start_date || input.end_date) {
      const moodConditions: SQL<unknown>[] = [];
      if (input.start_date) {
        moodConditions.push(gte(moodEntriesTable.date, input.start_date));
      }
      if (input.end_date) {
        moodConditions.push(lte(moodEntriesTable.date, input.end_date));
      }
      
      const whereCondition = moodConditions.length === 1 ? moodConditions[0] : and(...moodConditions);
      moodEntries = await db.select().from(moodEntriesTable).where(whereCondition).execute();
    } else {
      moodEntries = await db.select().from(moodEntriesTable).execute();
    }

    // Group data by date
    const dateMap = new Map<string, DailyEntry>();

    // Process tasks
    tasks.forEach(task => {
      const dateString = task.created_at.toISOString().split('T')[0];
      
      if (!dateMap.has(dateString)) {
        dateMap.set(dateString, {
          date: new Date(dateString + 'T00:00:00Z'),
          tasks: [],
          mood_entry: null
        });
      }
      
      dateMap.get(dateString)!.tasks.push(task);
    });

    // Process mood entries
    moodEntries.forEach(mood => {
      const dateString = mood.date;
      
      if (!dateMap.has(dateString)) {
        dateMap.set(dateString, {
          date: new Date(dateString + 'T00:00:00Z'),
          tasks: [],
          mood_entry: null
        });
      }
      
      // Convert date string to Date object for mood entry
      const moodWithDateObject = {
        ...mood,
        date: new Date(mood.date + 'T00:00:00Z')
      };
      
      dateMap.get(dateString)!.mood_entry = moodWithDateObject;
    });

    // Convert map to array and sort by date descending
    let dailyEntries = Array.from(dateMap.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );

    // Apply limit if specified
    if (input.limit && input.limit > 0) {
      dailyEntries = dailyEntries.slice(0, input.limit);
    }

    return dailyEntries;
  } catch (error) {
    console.error('Failed to get historical entries:', error);
    throw error;
  }
}
