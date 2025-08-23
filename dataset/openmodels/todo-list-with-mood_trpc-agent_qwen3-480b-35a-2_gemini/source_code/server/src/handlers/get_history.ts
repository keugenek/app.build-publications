import { db } from '../db';
import { tasksTable, moodLogsTable } from '../db/schema';
import { type Task, type MoodLog } from '../schema';
import { sql } from 'drizzle-orm';

export type HistoryRecord = {
  date: Date;
  tasksCompleted: Task[];
  moodLogs: MoodLog[];
};

export const getHistory = async (): Promise<HistoryRecord[]> => {
  try {
    // Get all completed tasks with their completion date
    const completedTasks = await db.select()
      .from(tasksTable)
      .where(sql`${tasksTable.completed} = true`)
      .execute();

    // Get all mood logs
    const moodLogs = await db.select()
      .from(moodLogsTable)
      .execute();

    // Group tasks by date (using updated_at as completion date)
    const tasksByDate: Map<string, Task[]> = new Map();
    completedTasks.forEach(task => {
      const dateKey = task.updated_at.toDateString();
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)?.push({
        ...task,
        due_date: task.due_date,
        created_at: task.created_at,
        updated_at: task.updated_at
      });
    });

    // Group mood logs by date
    const logsByDate: Map<string, MoodLog[]> = new Map();
    moodLogs.forEach(log => {
      const dateKey = log.logged_at.toDateString();
      if (!logsByDate.has(dateKey)) {
        logsByDate.set(dateKey, []);
      }
      logsByDate.get(dateKey)?.push({
        ...log,
        logged_at: log.logged_at
      });
    });

    // Get all unique dates
    const allDates = new Set([
      ...completedTasks.map(task => task.updated_at.toDateString()),
      ...moodLogs.map(log => log.logged_at.toDateString())
    ]);

    // Create history records for each date
    const historyRecords: HistoryRecord[] = Array.from(allDates)
      .map(dateStr => {
        const date = new Date(dateStr);
        return {
          date,
          tasksCompleted: tasksByDate.get(dateStr) || [],
          moodLogs: logsByDate.get(dateStr) || []
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return historyRecords;
  } catch (error) {
    console.error('Failed to fetch history:', error);
    throw error;
  }
};
