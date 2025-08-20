import { db } from '../db';
import { moodEntriesTable, tasksTable } from '../db/schema';
import { type HistoricalViewEntry } from '../schema';
import { sql } from 'drizzle-orm';

export const getHistoricalView = async (): Promise<HistoricalViewEntry[]> => {
  try {
    // Get task statistics grouped by date
    const taskStatsResult = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_count,
        COUNT(*) as total_count
      FROM ${tasksTable}
      GROUP BY DATE(created_at)
    `);
    
    const taskStats = taskStatsResult.rows.map((row: any) => ({
      date: row.date,
      completed_count: parseInt(row.completed_count) || 0,
      total_count: parseInt(row.total_count) || 0
    }));

    // Get all mood entries
    const moodEntriesResult = await db.execute(sql`
      SELECT 
        date,
        mood_level,
        notes
      FROM ${moodEntriesTable}
    `);
    
    const moodEntries = moodEntriesResult.rows.map((row: any) => ({
      date: row.date,
      mood_level: parseInt(row.mood_level) || 0,
      notes: row.notes
    }));

    // Create a map of task stats by date (as string)
    const taskStatsMap = new Map<string, { completed_count: number; total_count: number }>();
    taskStats.forEach(stat => {
      taskStatsMap.set(stat.date, {
        completed_count: stat.completed_count,
        total_count: stat.total_count
      });
    });

    // Create a map of mood entries by date
    const moodMap = new Map<string, { mood_level: number; notes: string | null }>();
    moodEntries.forEach(entry => {
      const dateStr = entry.date;
      moodMap.set(dateStr, {
        mood_level: entry.mood_level,
        notes: entry.notes
      });
    });

    // Get all unique dates from both maps
    const allDates = new Set<string>([
      ...Array.from(taskStatsMap.keys()),
      ...Array.from(moodMap.keys())
    ]);

    // Create the result array
    const result: HistoricalViewEntry[] = Array.from(allDates).map(dateStr => {
      const taskStat = taskStatsMap.get(dateStr) || { completed_count: 0, total_count: 0 };
      const moodEntry = moodMap.get(dateStr);

      return {
        date: new Date(dateStr),
        mood_level: moodEntry ? moodEntry.mood_level : null,
        notes: moodEntry ? moodEntry.notes : null,
        tasks_completed: taskStat.completed_count,
        total_tasks: taskStat.total_count
      };
    });

    // Sort by date descending
    result.sort((a, b) => b.date.getTime() - a.date.getTime());

    return result;
  } catch (error) {
    console.error('Failed to fetch historical view:', error);
    throw error;
  }
};
