import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { type Reminder } from '../schema';
import { getReminders } from '../handlers/get_reminders';
import { gte } from 'drizzle-orm';

// Helper to create reminders directly in DB
const createReminder = async (dueDate: Date, notes: string | null = null) => {
  await db
    .insert(remindersTable)
    .values({
      due_date: dueDate,
      service_type: 'oil_change',
      notes,
    })
    .returning()
    .execute();
};

describe('getReminders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return upcoming reminders sorted by due date', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Insert past and future reminders
    await createReminder(yesterday, 'past reminder');
    await createReminder(tomorrow, 'first upcoming');
    await createReminder(dayAfter, 'second upcoming');

    const reminders = await getReminders();

    // Should only include future reminders
    expect(reminders).toHaveLength(2);
    expect(reminders[0].due_date.getTime()).toBeLessThanOrEqual(reminders[1].due_date.getTime());
    expect(reminders[0].notes).toBe('first upcoming');
    expect(reminders[1].notes).toBe('second upcoming');
    // Ensure they are after now
    reminders.forEach(r => {
      expect(r.due_date.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });
});
