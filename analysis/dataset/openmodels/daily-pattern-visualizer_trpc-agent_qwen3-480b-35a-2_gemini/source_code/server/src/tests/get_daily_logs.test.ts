import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { getDailyLogs } from '../handlers/get_daily_logs';
import { sql } from 'drizzle-orm';

describe('getDailyLogs', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(dailyLogsTable).values([
      {
        date: sql`'2023-01-01'`,
        sleep_hours: '7.50',
        work_hours: '8.00',
        social_time: '2.00',
        screen_time: '4.50',
        emotional_energy: '7.00'
      },
      {
        date: sql`'2023-01-02'`,
        sleep_hours: '6.00',
        work_hours: '9.00',
        social_time: '1.50',
        screen_time: '6.00',
        emotional_energy: '5.00'
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all daily logs', async () => {
    const logs = await getDailyLogs();

    expect(logs).toHaveLength(2);
    
    // Check first log
    expect(logs[0].date).toEqual(new Date('2023-01-01'));
    expect(logs[0].sleep_hours).toBe(7.5);
    expect(logs[0].work_hours).toBe(8);
    expect(logs[0].social_time).toBe(2);
    expect(logs[0].screen_time).toBe(4.5);
    expect(logs[0].emotional_energy).toBe(7);
    expect(logs[0].id).toBeDefined();
    expect(logs[0].created_at).toBeInstanceOf(Date);
    
    // Check second log
    expect(logs[1].date).toEqual(new Date('2023-01-02'));
    expect(logs[1].sleep_hours).toBe(6);
    expect(logs[1].work_hours).toBe(9);
    expect(logs[1].social_time).toBe(1.5);
    expect(logs[1].screen_time).toBe(6);
    expect(logs[1].emotional_energy).toBe(5);
  });

  it('should return numeric values as numbers', async () => {
    const logs = await getDailyLogs();
    
    logs.forEach(log => {
      expect(typeof log.sleep_hours).toBe('number');
      expect(typeof log.work_hours).toBe('number');
      expect(typeof log.social_time).toBe('number');
      expect(typeof log.screen_time).toBe('number');
      expect(typeof log.emotional_energy).toBe('number');
    });
  });

  it('should order logs by date', async () => {
    const logs = await getDailyLogs();
    
    // Should be ordered by date ascending
    expect(logs[0].date.getTime()).toBeLessThan(logs[1].date.getTime());
  });

  it('should return empty array when no logs exist', async () => {
    // Clear all logs
    await db.delete(dailyLogsTable).execute();
    
    const logs = await getDailyLogs();
    expect(logs).toHaveLength(0);
  });
});
