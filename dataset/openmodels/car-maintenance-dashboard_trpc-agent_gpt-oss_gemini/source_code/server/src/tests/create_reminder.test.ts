import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { remindersTable } from '../db/schema';
import { type CreateReminderInput } from '../schema';
import { createReminder } from '../handlers/create_reminder';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateReminderInput = {
  due_date: new Date('2025-01-01T10:00:00Z'),
  service_type: 'Oil Change',
  notes: 'Change oil and filter',
};

describe('createReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reminder and return correct fields', async () => {
    const result = await createReminder(testInput);

    expect(result.id).toBeGreaterThan(0);
    expect(result.due_date).toEqual(testInput.due_date);
    expect(result.service_type).toBe('Oil Change');
    expect(result.notes).toBe('Change oil and filter');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist reminder in the database', async () => {
    const result = await createReminder(testInput);

    const reminders = await db
      .select()
      .from(remindersTable)
      .where(eq(remindersTable.id, result.id))
      .execute();

    expect(reminders).toHaveLength(1);
    const dbReminder = reminders[0];
    expect(dbReminder.service_type).toBe('Oil Change');
    expect(dbReminder.notes).toBe('Change oil and filter');
    // Drizzle returns Date objects for timestamp columns
    expect(dbReminder.due_date).toEqual(testInput.due_date);
    expect(dbReminder.created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable notes correctly', async () => {
    const input: CreateReminderInput = {
      due_date: new Date('2025-02-01T12:00:00Z'),
      service_type: 'Tire Rotation',
      notes: null,
    };
    const result = await createReminder(input);
    expect(result.notes).toBeNull();

    const dbReminder = await db
      .select()
      .from(remindersTable)
      .where(eq(remindersTable.id, result.id))
      .execute();
    expect(dbReminder[0].notes).toBeNull();
  });
});
