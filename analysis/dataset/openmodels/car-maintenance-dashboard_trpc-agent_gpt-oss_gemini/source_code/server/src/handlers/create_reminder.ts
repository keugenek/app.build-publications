import { type CreateReminderInput, type Reminder } from '../schema';

import { db } from '../db';
import { remindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Handler for creating a service reminder.
// Inserts the reminder into the database and returns the created record.
export const createReminder = async (input: CreateReminderInput): Promise<Reminder> => {
  try {
    const result = await db.insert(remindersTable)
      .values({
        due_date: input.due_date,
        service_type: input.service_type,
        notes: input.notes ?? null,
      })
      .returning()
      .execute();

    // The result is an array with the inserted row.
    const reminder = result[0];
    return {
      ...reminder,
      // Ensure date fields are proper Date objects (Drizzle returns Date for timestamps)
      due_date: new Date(reminder.due_date),
      created_at: new Date(reminder.created_at),
    } as Reminder;
  } catch (error) {
    console.error('Failed to create reminder:', error);
    throw error;
  }
};
