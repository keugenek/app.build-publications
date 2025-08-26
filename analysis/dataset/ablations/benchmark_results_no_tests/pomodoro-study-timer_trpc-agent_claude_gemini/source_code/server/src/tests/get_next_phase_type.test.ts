import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { getNextPhaseType } from '../handlers/get_next_phase_type';
import { eq } from 'drizzle-orm';

describe('getNextPhaseType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let sessionId: number;

  beforeEach(async () => {
    // Create a test session
    const sessions = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4, // Long break every 4 pomodoros
        completed_pomodoros: 0,
        is_active: false,
        current_phase: 'idle',
      })
      .returning()
      .execute();
    
    sessionId = sessions[0].id;
  });

  it('should return work phase when no logs exist', async () => {
    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('work');
  });

  it('should return short_break after first work phase', async () => {
    // Create a work phase log
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(),
        was_interrupted: false,
      })
      .execute();

    // Update session to have 1 completed pomodoro
    await db.update(pomodoroSessionsTable)
      .set({ completed_pomodoros: 1 })
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('short_break');
  });

  it('should return work phase after short break', async () => {
    // Create logs for work then short break
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-01T10:00:00Z'),
          completed_at: new Date('2024-01-01T10:25:00Z'),
          was_interrupted: false,
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: new Date('2024-01-01T10:25:00Z'),
          completed_at: new Date('2024-01-01T10:30:00Z'),
          was_interrupted: false,
        }
      ])
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('work');
  });

  it('should return long_break after completing interval pomodoros', async () => {
    // Update session to have completed 4 pomodoros (matches long_break_interval)
    await db.update(pomodoroSessionsTable)
      .set({ completed_pomodoros: 4 })
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    // Create a work phase log (the 4th completed work)
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(),
        was_interrupted: false,
      })
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('long_break');
  });

  it('should return work phase after long break', async () => {
    // Create logs ending with long break
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-01T10:00:00Z'),
          completed_at: new Date('2024-01-01T10:25:00Z'),
          was_interrupted: false,
        },
        {
          session_id: sessionId,
          phase_type: 'long_break',
          duration_minutes: 15,
          started_at: new Date('2024-01-01T10:25:00Z'),
          completed_at: new Date('2024-01-01T10:40:00Z'),
          was_interrupted: false,
        }
      ])
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('work');
  });

  it('should handle different long_break_interval settings', async () => {
    // Create session with interval of 3
    const sessions = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 3, // Long break every 3 pomodoros
        completed_pomodoros: 3,
        is_active: false,
        current_phase: 'idle',
      })
      .returning()
      .execute();

    const customSessionId = sessions[0].id;

    // Create work phase log
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: customSessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(),
        was_interrupted: false,
      })
      .execute();

    const nextPhase = await getNextPhaseType(customSessionId);
    expect(nextPhase).toBe('long_break');
  });

  it('should use most recent log for phase determination', async () => {
    // Create multiple logs, with short_break being the most recent
    await db.insert(pomodoroLogsTable)
      .values([
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-01T10:00:00Z'),
          completed_at: new Date('2024-01-01T10:25:00Z'),
          was_interrupted: false,
        },
        {
          session_id: sessionId,
          phase_type: 'work',
          duration_minutes: 25,
          started_at: new Date('2024-01-01T11:00:00Z'),
          completed_at: new Date('2024-01-01T11:25:00Z'),
          was_interrupted: false,
        },
        {
          session_id: sessionId,
          phase_type: 'short_break',
          duration_minutes: 5,
          started_at: new Date('2024-01-01T11:25:00Z'),
          completed_at: new Date('2024-01-01T11:30:00Z'),
          was_interrupted: false,
        }
      ])
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('work');
  });

  it('should throw error for non-existent session', async () => {
    await expect(getNextPhaseType(99999)).rejects.toThrow(/not found/i);
  });

  it('should handle edge case of 8 completed pomodoros with interval 4', async () => {
    // Update session to have 8 completed pomodoros (2 * long_break_interval)
    await db.update(pomodoroSessionsTable)
      .set({ completed_pomodoros: 8 })
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    // Create a work phase log
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(),
        was_interrupted: false,
      })
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('long_break'); // 8 % 4 === 0
  });

  it('should return short_break for completed_pomodoros not divisible by interval', async () => {
    // Update session to have 5 completed pomodoros (not divisible by 4)
    await db.update(pomodoroSessionsTable)
      .set({ completed_pomodoros: 5 })
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    // Create a work phase log
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: sessionId,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(),
        was_interrupted: false,
      })
      .execute();

    const nextPhase = await getNextPhaseType(sessionId);
    expect(nextPhase).toBe('short_break'); // 5 % 4 !== 0
  });
});
