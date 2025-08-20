import { type Reminder } from '../schema';
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { gte } from 'drizzle-orm';

// Placeholder handler for fetching all upcoming reminders.
// Real implementation should query the database, sort by due date and flag overdue.
export const getReminders = async (): Promise<Reminder[]> => {
  try {
    // Fetch reminders with due_date >= now, sorted ascending
    const now = new Date();
    const reminders = await db
      .select()
      .from(remindersTable)
      .where(gte(remindersTable.due_date, now))
      .orderBy(remindersTable.due_date)
      .execute();
    return reminders;
  } catch (error) {
    console.error('Failed to get reminders:', error);
    throw error;
  }
};
