import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { type GetDailyLogsInput } from '../schema';
import { getDailyLogs } from '../handlers/get_daily_logs';

describe('getDailyLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return logs for a specific date', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 2,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create logs for target date (2024-01-15)
    const targetDate = new Date('2024-01-15T10:00:00Z');
    const targetDate2 = new Date('2024-01-15T11:30:00Z');
    
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: targetDate,
          completed_at: new Date('2024-01-15T10:25:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: targetDate2,
          completed_at: new Date('2024-01-15T11:35:00Z'),
          was_interrupted: false
        }
      ])
      .execute();

    // Create logs for different dates (should not be included)
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-14T10:00:00Z'), // Previous day
          completed_at: new Date('2024-01-14T10:25:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-16T10:00:00Z'), // Next day
          completed_at: new Date('2024-01-16T10:25:00Z'),
          was_interrupted: false
        }
      ])
      .execute();

    const input: GetDailyLogsInput = {
      date: '2024-01-15'
    };

    const result = await getDailyLogs(input);

    // Should return only the logs from 2024-01-15
    expect(result).toHaveLength(2);
    
    // Verify the first log (ordered by started_at)
    expect(result[0].phase_type).toEqual('work');
    expect(result[0].duration_minutes).toEqual(25);
    expect(result[0].started_at).toEqual(targetDate);
    expect(result[0].completed_at).toEqual(new Date('2024-01-15T10:25:00Z'));
    expect(result[0].was_interrupted).toEqual(false);
    expect(result[0].session_id).toEqual(sessionId);
    
    // Verify the second log
    expect(result[1].phase_type).toEqual('short_break');
    expect(result[1].duration_minutes).toEqual(5);
    expect(result[1].started_at).toEqual(targetDate2);
    expect(result[1].was_interrupted).toEqual(false);
  });

  it('should return empty array when no logs exist for date', async () => {
    const input: GetDailyLogsInput = {
      date: '2024-01-15'
    };

    const result = await getDailyLogs(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return logs ordered by started_at chronologically', async () => {
    // Create a test session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 3,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create logs in reverse chronological order to test sorting
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'long_break',
          duration_minutes: 15,
          started_at: new Date('2024-01-15T14:00:00Z'), // Latest
          completed_at: new Date('2024-01-15T14:15:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T08:00:00Z'), // Earliest
          completed_at: new Date('2024-01-15T08:25:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: new Date('2024-01-15T11:00:00Z'), // Middle
          completed_at: null, // Interrupted break
          was_interrupted: true
        }
      ])
      .execute();

    const input: GetDailyLogsInput = {
      date: '2024-01-15'
    };

    const result = await getDailyLogs(input);

    expect(result).toHaveLength(3);
    
    // Verify chronological order
    expect(result[0].started_at).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result[0].phase_type).toEqual('work');
    
    expect(result[1].started_at).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result[1].phase_type).toEqual('short_break');
    expect(result[1].completed_at).toBeNull();
    expect(result[1].was_interrupted).toEqual(true);
    
    expect(result[2].started_at).toEqual(new Date('2024-01-15T14:00:00Z'));
    expect(result[2].phase_type).toEqual('long_break');
  });

  it('should handle logs across different times of day', async () => {
    // Create a test session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: true,
        current_phase: 'work',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create logs at various times within the same day
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T00:30:00Z'), // Early morning
          completed_at: new Date('2024-01-15T00:55:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T12:00:00Z'), // Noon
          completed_at: new Date('2024-01-15T12:25:00Z'),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T23:30:00Z'), // Late night
          completed_at: new Date('2024-01-15T23:55:00Z'),
          was_interrupted: false
        }
      ])
      .execute();

    // Add a log just after midnight (should not be included)
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date('2024-01-16T00:00:00Z'), // Next day
        completed_at: new Date('2024-01-16T00:25:00Z'),
        was_interrupted: false
      })
      .execute();

    const input: GetDailyLogsInput = {
      date: '2024-01-15'
    };

    const result = await getDailyLogs(input);

    expect(result).toHaveLength(3);
    
    // Verify all logs are from the correct date
    result.forEach(log => {
      const logDate = new Date(log.started_at);
      expect(logDate.getFullYear()).toEqual(2024);
      expect(logDate.getMonth()).toEqual(0); // January (0-indexed)
      expect(logDate.getDate()).toEqual(15);
    });
  });

  it('should include both completed and interrupted logs', async () => {
    // Create a test session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 1,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create mix of completed and interrupted logs
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T09:00:00Z'),
          completed_at: new Date('2024-01-15T09:25:00Z'), // Completed
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: new Date('2024-01-15T09:25:00Z'),
          completed_at: null, // Interrupted
          was_interrupted: true
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-15T09:30:00Z'),
          completed_at: null, // Interrupted
          was_interrupted: true
        }
      ])
      .execute();

    const input: GetDailyLogsInput = {
      date: '2024-01-15'
    };

    const result = await getDailyLogs(input);

    expect(result).toHaveLength(3);
    
    // Verify mix of completed and interrupted logs
    expect(result[0].was_interrupted).toEqual(false);
    expect(result[0].completed_at).not.toBeNull();
    
    expect(result[1].was_interrupted).toEqual(true);
    expect(result[1].completed_at).toBeNull();
    
    expect(result[2].was_interrupted).toEqual(true);
    expect(result[2].completed_at).toBeNull();
  });
});
