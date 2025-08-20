import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { getActiveSession } from '../handlers/get_active_session';

describe('getActiveSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no sessions exist', async () => {
    const result = await getActiveSession();
    expect(result).toBeNull();
  });

  it('should return null when no active sessions exist', async () => {
    // Create an inactive session
    await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        is_active: false,
        current_phase: 'idle',
        completed_pomodoros: 0
      })
      .execute();

    const result = await getActiveSession();
    expect(result).toBeNull();
  });

  it('should return the active session when one exists', async () => {
    // Create an active session
    const insertResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        long_break_interval: 3,
        is_active: true,
        current_phase: 'work',
        completed_pomodoros: 2,
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const result = await getActiveSession();

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.work_duration).toEqual(30);
    expect(result!.short_break_duration).toEqual(10);
    expect(result!.long_break_duration).toEqual(20);
    expect(result!.long_break_interval).toEqual(3);
    expect(result!.is_active).toEqual(true);
    expect(result!.current_phase).toEqual('work');
    expect(result!.completed_pomodoros).toEqual(2);
    expect(result!.phase_start_time).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the first active session when multiple active sessions exist', async () => {
    // Create multiple active sessions
    await db.insert(pomodoroSessionsTable)
      .values([
        {
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          long_break_interval: 4,
          is_active: true,
          current_phase: 'work',
          completed_pomodoros: 1
        },
        {
          work_duration: 30,
          short_break_duration: 10,
          long_break_duration: 20,
          long_break_interval: 3,
          is_active: true,
          current_phase: 'short_break',
          completed_pomodoros: 2
        }
      ])
      .execute();

    const result = await getActiveSession();

    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(true);
    // Should return one of the active sessions
    expect(result!.work_duration).toBeDefined();
    expect(result!.current_phase).toMatch(/^(work|short_break|long_break|idle)$/);
  });

  it('should return active session with all phase types', async () => {
    // Test with different current_phase values
    const phaseTypes = ['work', 'short_break', 'long_break', 'idle'] as const;

    for (const phase of phaseTypes) {
      // Clear previous data
      await db.delete(pomodoroSessionsTable).execute();

      // Create session with specific phase
      await db.insert(pomodoroSessionsTable)
        .values({
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          long_break_interval: 4,
          is_active: true,
          current_phase: phase,
          completed_pomodoros: 0
        })
        .execute();

      const result = await getActiveSession();

      expect(result).not.toBeNull();
      expect(result!.current_phase).toEqual(phase);
      expect(result!.is_active).toEqual(true);
    }
  });

  it('should handle sessions with null phase_start_time', async () => {
    // Create active session without phase_start_time
    await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        is_active: true,
        current_phase: 'idle',
        completed_pomodoros: 0,
        phase_start_time: null
      })
      .execute();

    const result = await getActiveSession();

    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(true);
    expect(result!.phase_start_time).toBeNull();
    expect(result!.current_phase).toEqual('idle');
  });
});
