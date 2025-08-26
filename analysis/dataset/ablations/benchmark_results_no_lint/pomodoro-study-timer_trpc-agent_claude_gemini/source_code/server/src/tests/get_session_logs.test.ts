import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { type GetSessionLogsInput } from '../schema';
import { getSessionLogs } from '../handlers/get_session_logs';

describe('getSessionLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test timer sessions
  const createTestSessions = async (sessions: Array<{
    session_type: 'work' | 'break';
    duration_minutes: number;
    completed_at: Date;
  }>) => {
    await db.insert(timerSessionsTable)
      .values(sessions)
      .execute();
  };

  it('should return empty array when no sessions exist', async () => {
    const result = await getSessionLogs();
    expect(result).toEqual([]);
  });

  it('should aggregate sessions by date correctly', async () => {
    const today = new Date('2024-01-15T10:00:00Z');
    const yesterday = new Date('2024-01-14T15:30:00Z');

    await createTestSessions([
      // Today's sessions
      { session_type: 'work', duration_minutes: 25, completed_at: today },
      { session_type: 'work', duration_minutes: 30, completed_at: new Date('2024-01-15T14:00:00Z') },
      { session_type: 'break', duration_minutes: 5, completed_at: new Date('2024-01-15T16:00:00Z') },
      // Yesterday's sessions
      { session_type: 'work', duration_minutes: 20, completed_at: yesterday },
      { session_type: 'break', duration_minutes: 10, completed_at: new Date('2024-01-14T18:00:00Z') },
      { session_type: 'break', duration_minutes: 15, completed_at: new Date('2024-01-14T20:00:00Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-14',
      end_date: '2024-01-15'
    });

    expect(result).toHaveLength(2);
    
    // Results should be ordered by date descending (most recent first)
    const todayLog = result.find(log => log.date === '2024-01-15');
    const yesterdayLog = result.find(log => log.date === '2024-01-14');

    expect(todayLog).toBeDefined();
    expect(todayLog!.work_sessions_count).toEqual(2);
    expect(todayLog!.break_sessions_count).toEqual(1);
    expect(todayLog!.total_work_minutes).toEqual(55);
    expect(todayLog!.total_break_minutes).toEqual(5);

    expect(yesterdayLog).toBeDefined();
    expect(yesterdayLog!.work_sessions_count).toEqual(1);
    expect(yesterdayLog!.break_sessions_count).toEqual(2);
    expect(yesterdayLog!.total_work_minutes).toEqual(20);
    expect(yesterdayLog!.total_break_minutes).toEqual(25);
  });

  it('should handle date filtering with start_date only', async () => {
    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: new Date('2024-01-10T10:00:00Z') },
      { session_type: 'work', duration_minutes: 30, completed_at: new Date('2024-01-15T14:00:00Z') },
      { session_type: 'break', duration_minutes: 5, completed_at: new Date('2024-01-20T16:00:00Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-12'
    });

    expect(result).toHaveLength(2);
    expect(result.every(log => log.date >= '2024-01-12')).toBe(true);
  });

  it('should handle date filtering with end_date only', async () => {
    // Create sessions within a reasonable timeframe 
    const endDate = new Date('2024-01-16');
    const withinRange = new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days before end_date
    const alsoWithinRange = new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days before end_date
    const outsideRange = new Date(endDate.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days after end_date

    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: withinRange },
      { session_type: 'work', duration_minutes: 30, completed_at: alsoWithinRange },
      { session_type: 'break', duration_minutes: 5, completed_at: outsideRange }
    ]);

    const result = await getSessionLogs({
      end_date: '2024-01-16'
    });

    // Should include sessions up to and including 2024-01-16, but exclude the one after
    const includedDates = result.map(log => log.date);
    expect(includedDates).toHaveLength(2);
    expect(includedDates.every(date => date <= '2024-01-16')).toBe(true);
    
    // Should not include the session from after the end_date
    const futureDate = outsideRange.toISOString().split('T')[0];
    expect(includedDates).not.toContain(futureDate);
  });

  it('should handle sessions with only work type', async () => {
    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: new Date('2024-01-15T10:00:00Z') },
      { session_type: 'work', duration_minutes: 30, completed_at: new Date('2024-01-15T14:00:00Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    });

    expect(result).toHaveLength(1);
    expect(result[0].work_sessions_count).toEqual(2);
    expect(result[0].break_sessions_count).toEqual(0);
    expect(result[0].total_work_minutes).toEqual(55);
    expect(result[0].total_break_minutes).toEqual(0);
  });

  it('should handle sessions with only break type', async () => {
    await createTestSessions([
      { session_type: 'break', duration_minutes: 5, completed_at: new Date('2024-01-15T10:00:00Z') },
      { session_type: 'break', duration_minutes: 10, completed_at: new Date('2024-01-15T14:00:00Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    });

    expect(result).toHaveLength(1);
    expect(result[0].work_sessions_count).toEqual(0);
    expect(result[0].break_sessions_count).toEqual(2);
    expect(result[0].total_work_minutes).toEqual(0);
    expect(result[0].total_break_minutes).toEqual(15);
  });

  it('should return results ordered by date descending', async () => {
    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: new Date('2024-01-10T10:00:00Z') },
      { session_type: 'work', duration_minutes: 30, completed_at: new Date('2024-01-15T14:00:00Z') },
      { session_type: 'break', duration_minutes: 5, completed_at: new Date('2024-01-12T16:00:00Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-10',
      end_date: '2024-01-15'
    });

    expect(result).toHaveLength(3);
    // Verify descending order
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[1].date).toEqual('2024-01-12');
    expect(result[2].date).toEqual('2024-01-10');
  });

  it('should use default 30-day range when no dates provided', async () => {
    // Create sessions across different time periods
    const now = new Date();
    const recent = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const old = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago

    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: recent },
      { session_type: 'work', duration_minutes: 30, completed_at: old } // Should be excluded
    ]);

    const result = await getSessionLogs();

    // Should only include the recent session (within last 30 days)
    expect(result).toHaveLength(1);
    expect(result[0].work_sessions_count).toEqual(1);
    expect(result[0].total_work_minutes).toEqual(25);
  });

  it('should handle edge case with sessions at day boundaries', async () => {
    // Test sessions exactly at start and end of days
    await createTestSessions([
      { session_type: 'work', duration_minutes: 25, completed_at: new Date('2024-01-15T00:00:00Z') },
      { session_type: 'break', duration_minutes: 5, completed_at: new Date('2024-01-15T23:59:59Z') }
    ]);

    const result = await getSessionLogs({
      start_date: '2024-01-15',
      end_date: '2024-01-15'
    });

    expect(result).toHaveLength(1);
    expect(result[0].work_sessions_count).toEqual(1);
    expect(result[0].break_sessions_count).toEqual(1);
    expect(result[0].total_work_minutes).toEqual(25);
    expect(result[0].total_break_minutes).toEqual(5);
  });
});
