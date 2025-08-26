import { db } from '../db';
import { tasksTable, moodsTable } from '../db/schema';
import { type JournalEntry } from '../schema';

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    // Since we can't easily get distinct dates with Drizzle ORM,
    // we'll fetch all tasks and moods and group them by date in memory
    
    // Fetch all tasks
    const tasks = await db.select().from(tasksTable).execute();
    
    // Fetch all moods
    const moods = await db.select().from(moodsTable).execute();
    
    // Group tasks by date
    const tasksByDate: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      const dateKey = task.created_at.toISOString().split('T')[0];
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
    
    // Group moods by date
    const moodsByDate: Record<string, typeof moods[0] | null> = {};
    for (const mood of moods) {
      const dateKey = mood.created_at.toISOString().split('T')[0];
      moodsByDate[dateKey] = mood;
    }
    
    // Get all unique dates
    const dateKeys = new Set([
      ...Object.keys(tasksByDate),
      ...Object.keys(moodsByDate)
    ]);
    
    // Create journal entries sorted by date (newest first)
    const sortedDateKeys = Array.from(dateKeys).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    const journalEntries: JournalEntry[] = sortedDateKeys.map(dateKey => {
      const date = new Date(dateKey);
      const tasksForDate = tasksByDate[dateKey] || [];
      const moodForDate = moodsByDate[dateKey] || null;
      
      return {
        date,
        tasks: tasksForDate.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description ?? null,
          completed: task.completed,
          created_at: task.created_at,
          updated_at: task.updated_at
        })),
        mood: moodForDate ? {
          id: moodForDate.id,
          mood: moodForDate.mood,
          description: moodForDate.description ?? null,
          created_at: moodForDate.created_at
        } : null
      };
    });
    
    return journalEntries;
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    throw error;
  }
};
