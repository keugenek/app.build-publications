import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type GetActivityLogsInput } from '../schema';
import { getActivityLogs } from '../handlers/get_activity_logs';

// Helper function to create test activity log data
const createTestActivityLog = async (data: {
  user_id: string;
  date: string;
  sleep_hours: number;
  work_hours: number;
  social_hours: number;
  screen_hours: number;
  emotional_energy: number;
  notes?: string | null;
}) => {
  return await db.insert(activityLogsTable)
    .values({
      user_id: data.user_id,
      date: data.date,
      sleep_hours: data.sleep_hours.toString(),
      work_hours: data.work_hours.toString(),
      social_hours: data.social_hours.toString(),
      screen_hours: data.screen_hours.toString(),
      emotional_energy: data.emotional_energy,
      notes: data.notes || null
    })
    .returning()
    .execute();
};

describe('getActivityLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve activity logs for a user', async () => {
    // Create test data
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 8.5,
      work_hours: 7.25,
      social_hours: 2.0,
      screen_hours: 5.5,
      emotional_energy: 8,
      notes: 'Great productive day'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-14',
      sleep_hours: 7.0,
      work_hours: 8.0,
      social_hours: 1.5,
      screen_hours: 6.0,
      emotional_energy: 6,
      notes: null
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe('user123');
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(typeof result[0].work_hours).toBe('number');
    expect(typeof result[0].social_hours).toBe('number');
    expect(typeof result[0].screen_hours).toBe('number');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should order results by date descending (most recent first)', async () => {
    // Create test data in different order
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-10',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7,
      notes: 'Older entry'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 7.5,
      work_hours: 7.0,
      social_hours: 3.0,
      screen_hours: 5.0,
      emotional_energy: 8,
      notes: 'Newer entry'
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(2);
    // First result should be the more recent date
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(result[0].notes).toBe('Newer entry');
    expect(result[1].date.toISOString().split('T')[0]).toBe('2024-01-10');
    expect(result[1].notes).toBe('Older entry');
  });

  it('should filter by user_id only returning logs for specific user', async () => {
    // Create data for different users
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7
    });

    await createTestActivityLog({
      user_id: 'user456',
      date: '2024-01-15',
      sleep_hours: 7.0,
      work_hours: 6.0,
      social_hours: 3.0,
      screen_hours: 4.0,
      emotional_energy: 8
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user123');
  });

  it('should filter by date range when start_date is provided', async () => {
    // Create test data across different dates
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-10',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7,
      notes: 'Before range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 7.5,
      work_hours: 7.0,
      social_hours: 3.0,
      screen_hours: 5.0,
      emotional_energy: 8,
      notes: 'In range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-20',
      sleep_hours: 8.5,
      work_hours: 6.0,
      social_hours: 2.5,
      screen_hours: 4.0,
      emotional_energy: 9,
      notes: 'Also in range'
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-15'),
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(2);
    expect(result.every(log => log.date >= new Date('2024-01-15'))).toBe(true);
    expect(result[0].notes).toBe('Also in range'); // Most recent first
    expect(result[1].notes).toBe('In range');
  });

  it('should filter by date range when end_date is provided', async () => {
    // Create test data across different dates
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-10',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7,
      notes: 'In range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 7.5,
      work_hours: 7.0,
      social_hours: 3.0,
      screen_hours: 5.0,
      emotional_energy: 8,
      notes: 'Also in range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-20',
      sleep_hours: 8.5,
      work_hours: 6.0,
      social_hours: 2.5,
      screen_hours: 4.0,
      emotional_energy: 9,
      notes: 'After range'
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      end_date: new Date('2024-01-15'),
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(2);
    expect(result.every(log => log.date <= new Date('2024-01-15'))).toBe(true);
    expect(result[0].notes).toBe('Also in range'); // Most recent first
    expect(result[1].notes).toBe('In range');
  });

  it('should filter by both start_date and end_date when provided', async () => {
    // Create test data across different dates
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-05',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7,
      notes: 'Before range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-12',
      sleep_hours: 7.5,
      work_hours: 7.0,
      social_hours: 3.0,
      screen_hours: 5.0,
      emotional_energy: 8,
      notes: 'In range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-18',
      sleep_hours: 8.5,
      work_hours: 6.0,
      social_hours: 2.5,
      screen_hours: 4.0,
      emotional_energy: 9,
      notes: 'Also in range'
    });

    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-25',
      sleep_hours: 7.0,
      work_hours: 9.0,
      social_hours: 1.5,
      screen_hours: 7.0,
      emotional_energy: 6,
      notes: 'After range'
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      start_date: new Date('2024-01-10'),
      end_date: new Date('2024-01-20'),
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(2);
    expect(result.every(log => 
      log.date >= new Date('2024-01-10') && log.date <= new Date('2024-01-20')
    )).toBe(true);
    expect(result[0].notes).toBe('Also in range'); // Most recent first
    expect(result[1].notes).toBe('In range');
  });

  it('should respect the limit parameter', async () => {
    // Create more test data than the limit
    for (let i = 1; i <= 5; i++) {
      await createTestActivityLog({
        user_id: 'user123',
        date: `2024-01-${i.toString().padStart(2, '0')}`,
        sleep_hours: 8.0,
        work_hours: 8.0,
        social_hours: 2.0,
        screen_hours: 6.0,
        emotional_energy: 7,
        notes: `Day ${i}`
      });
    }

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 3
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(3);
    // Should return the 3 most recent entries
    expect(result[0].notes).toBe('Day 5');
    expect(result[1].notes).toBe('Day 4');
    expect(result[2].notes).toBe('Day 3');
  });

  it('should return empty array when no logs found for user', async () => {
    // Create data for a different user
    await createTestActivityLog({
      user_id: 'other_user',
      date: '2024-01-15',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(0);
  });

  it('should handle null notes correctly', async () => {
    await createTestActivityLog({
      user_id: 'user123',
      date: '2024-01-15',
      sleep_hours: 8.0,
      work_hours: 8.0,
      social_hours: 2.0,
      screen_hours: 6.0,
      emotional_energy: 7,
      notes: null
    });

    const input: GetActivityLogsInput = {
      user_id: 'user123',
      limit: 30
    };

    const result = await getActivityLogs(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
  });
});
