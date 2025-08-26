import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { getSessionStats } from '../handlers/get_session_stats';

describe('getSessionStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats for session with no logs', async () => {
    // Create a session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const result = await getSessionStats(sessionId);

    expect(result.session_id).toEqual(sessionId);
    expect(result.total_completed_pomodoros).toEqual(0);
    expect(result.total_work_time).toEqual(0);
    expect(result.total_break_time).toEqual(0);
    expect(result.completion_rate).toEqual(0);
    expect(result.last_activity).toBeNull();
  });

  it('should calculate stats correctly for completed phases', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    // Add completed work phase
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: earlier,
        completed_at: now,
        was_interrupted: false
      })
      .execute();

    // Add completed short break
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'short_break',
        duration_minutes: 5,
        started_at: now,
        completed_at: new Date(now.getTime() + 30000),
        was_interrupted: false
      })
      .execute();

    const result = await getSessionStats(sessionId);

    expect(result.session_id).toEqual(sessionId);
    expect(result.total_completed_pomodoros).toEqual(1); // Only work phases count
    expect(result.total_work_time).toEqual(25);
    expect(result.total_break_time).toEqual(5);
    expect(result.completion_rate).toEqual(100); // Both phases completed
    expect(result.last_activity).toBeInstanceOf(Date);
  });

  it('should handle interrupted phases correctly', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const now = new Date();

    // Add interrupted work phase
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 15, // Interrupted early
        started_at: now,
        completed_at: null, // Not completed
        was_interrupted: true
      })
      .execute();

    // Add completed work phase
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(now.getTime() + 60000),
        completed_at: new Date(now.getTime() + 120000),
        was_interrupted: false
      })
      .execute();

    const result = await getSessionStats(sessionId);

    expect(result.session_id).toEqual(sessionId);
    expect(result.total_completed_pomodoros).toEqual(1); // Only non-interrupted work phases
    expect(result.total_work_time).toEqual(40); // 15 + 25 minutes total
    expect(result.total_break_time).toEqual(0);
    expect(result.completion_rate).toEqual(50); // 1 out of 2 phases completed
    expect(result.last_activity).toBeInstanceOf(Date);
  });

  it('should handle mixed phase types correctly', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const baseTime = new Date();

    // Add multiple phases
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: baseTime,
          completed_at: new Date(baseTime.getTime() + 1000),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: new Date(baseTime.getTime() + 2000),
          completed_at: new Date(baseTime.getTime() + 3000),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 20,
          started_at: new Date(baseTime.getTime() + 4000),
          completed_at: null,
          was_interrupted: true
        },
        {
          session_id: sessionId,
          phase_type: 'long_break',
          duration_minutes: 15,
          started_at: new Date(baseTime.getTime() + 5000),
          completed_at: new Date(baseTime.getTime() + 6000),
          was_interrupted: false
        }
      ])
      .execute();

    const result = await getSessionStats(sessionId);

    expect(result.session_id).toEqual(sessionId);
    expect(result.total_completed_pomodoros).toEqual(1); // Only first work phase completed
    expect(result.total_work_time).toEqual(45); // 25 + 20 minutes
    expect(result.total_break_time).toEqual(20); // 5 + 15 minutes
    expect(result.completion_rate).toEqual(75); // 3 out of 4 phases completed
    expect(result.last_activity).toBeInstanceOf(Date);
  });

  it('should find the most recent activity correctly', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const oldTime = new Date('2023-01-01T10:00:00Z');
    const newTime = new Date('2023-01-02T15:30:00Z');

    // Add logs with different start times
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: oldTime,
          completed_at: new Date(oldTime.getTime() + 1000),
          was_interrupted: false
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: newTime, // This should be the last activity
          completed_at: new Date(newTime.getTime() + 1000),
          was_interrupted: false
        }
      ])
      .execute();

    const result = await getSessionStats(sessionId);

    expect(result.last_activity).toEqual(newTime);
  });

  it('should throw error for non-existent session', async () => {
    const nonExistentId = 999;

    expect(getSessionStats(nonExistentId)).rejects.toThrow(/Session with id 999 not found/i);
  });

  it('should calculate completion rate correctly with all interrupted phases', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const now = new Date();

    // Add all interrupted phases
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 10,
          started_at: now,
          completed_at: null,
          was_interrupted: true
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 2,
          started_at: new Date(now.getTime() + 1000),
          completed_at: null,
          was_interrupted: true
        }
      ])
      .execute();

    const result = await getSessionStats(sessionId);

    expect(result.session_id).toEqual(sessionId);
    expect(result.total_completed_pomodoros).toEqual(0);
    expect(result.completion_rate).toEqual(0); // All phases interrupted
    expect(result.total_work_time).toEqual(10);
    expect(result.total_break_time).toEqual(2);
  });
});
