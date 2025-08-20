import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type CreateActivityLogInput } from '../schema';
import { createActivityLog } from '../handlers/create_activity_log';
import { eq, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateActivityLogInput = {
  user_id: 'user123',
  date: new Date('2024-01-15T10:00:00.000Z'),
  sleep_hours: 7.5,
  work_hours: 8.0,
  social_hours: 2.5,
  screen_hours: 4.0,
  emotional_energy: 7,
  notes: 'Productive day with good sleep'
};

describe('createActivityLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an activity log', async () => {
    const result = await createActivityLog(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user123');
    expect(result.date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_hours).toEqual(2.5);
    expect(result.screen_hours).toEqual(4.0);
    expect(result.emotional_energy).toEqual(7);
    expect(result.notes).toEqual('Productive day with good sleep');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric field types
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.social_hours).toBe('number');
    expect(typeof result.screen_hours).toBe('number');
  });

  it('should save activity log to database', async () => {
    const result = await createActivityLog(testInput);

    // Query using proper drizzle syntax
    const activityLogs = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, result.id))
      .execute();

    expect(activityLogs).toHaveLength(1);
    const savedLog = activityLogs[0];
    
    expect(savedLog.user_id).toEqual('user123');
    expect(savedLog.date).toEqual('2024-01-15'); // Date stored as YYYY-MM-DD string
    expect(parseFloat(savedLog.sleep_hours)).toEqual(7.5);
    expect(parseFloat(savedLog.work_hours)).toEqual(8.0);
    expect(parseFloat(savedLog.social_hours)).toEqual(2.5);
    expect(parseFloat(savedLog.screen_hours)).toEqual(4.0);
    expect(savedLog.emotional_energy).toEqual(7);
    expect(savedLog.notes).toEqual('Productive day with good sleep');
    expect(savedLog.created_at).toBeInstanceOf(Date);
    expect(savedLog.updated_at).toBeInstanceOf(Date);
  });

  it('should handle activity log without notes', async () => {
    const inputWithoutNotes: CreateActivityLogInput = {
      ...testInput,
      notes: undefined
    };

    const result = await createActivityLog(inputWithoutNotes);

    expect(result.notes).toBeNull();
    expect(result.user_id).toEqual('user123');
    expect(result.sleep_hours).toEqual(7.5);
  });

  it('should handle activity log with null notes', async () => {
    const inputWithNullNotes: CreateActivityLogInput = {
      ...testInput,
      notes: null
    };

    const result = await createActivityLog(inputWithNullNotes);

    expect(result.notes).toBeNull();
    expect(result.user_id).toEqual('user123');
    expect(result.sleep_hours).toEqual(7.5);
  });

  it('should reject future dates', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureInput: CreateActivityLogInput = {
      ...testInput,
      date: tomorrow
    };

    await expect(createActivityLog(futureInput)).rejects.toThrow(/future dates/i);
  });

  it('should allow current date', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon today

    const todayInput: CreateActivityLogInput = {
      ...testInput,
      date: today
    };

    const result = await createActivityLog(todayInput);

    expect(result.user_id).toEqual('user123');
    expect(result.date.toDateString()).toEqual(today.toDateString());
  });

  it('should prevent duplicate entries for same user and date', async () => {
    // Create first activity log
    await createActivityLog(testInput);

    // Try to create another log for the same user and date
    const duplicateInput: CreateActivityLogInput = {
      ...testInput,
      sleep_hours: 6.0, // Different values
      work_hours: 9.0,
      notes: 'Different notes'
    };

    await expect(createActivityLog(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow same date for different users', async () => {
    // Create activity log for first user
    await createActivityLog(testInput);

    // Create activity log for different user on same date
    const differentUserInput: CreateActivityLogInput = {
      ...testInput,
      user_id: 'user456'
    };

    const result = await createActivityLog(differentUserInput);

    expect(result.user_id).toEqual('user456');
    expect(result.date.toDateString()).toEqual(testInput.date.toDateString());
  });

  it('should handle edge case time values', async () => {
    const edgeInput: CreateActivityLogInput = {
      user_id: 'user789',
      date: new Date('2024-01-10T08:30:00.000Z'),
      sleep_hours: 0, // Minimum value
      work_hours: 24, // Maximum value
      social_hours: 12.25, // Decimal value
      screen_hours: 0.5, // Small decimal
      emotional_energy: 1, // Minimum energy
      notes: 'Edge case test'
    };

    const result = await createActivityLog(edgeInput);

    expect(result.sleep_hours).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_hours).toEqual(12.25);
    expect(result.screen_hours).toEqual(0.5);
    expect(result.emotional_energy).toEqual(1);
    expect(result.notes).toEqual('Edge case test');
  });

  it('should query activity logs by user and date correctly', async () => {
    // Create multiple activity logs
    await createActivityLog(testInput);

    const anotherInput: CreateActivityLogInput = {
      ...testInput,
      date: new Date('2024-01-16T10:00:00.000Z'),
      user_id: 'user456'
    };
    await createActivityLog(anotherInput);

    // Query for specific user and date
    const activityLogs = await db.select()
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.user_id, 'user123'),
        eq(activityLogsTable.date, '2024-01-15')
      ))
      .execute();

    expect(activityLogs).toHaveLength(1);
    expect(activityLogs[0].user_id).toEqual('user123');
    expect(activityLogs[0].date).toEqual('2024-01-15');
    expect(parseFloat(activityLogs[0].sleep_hours)).toEqual(7.5);
  });
});
