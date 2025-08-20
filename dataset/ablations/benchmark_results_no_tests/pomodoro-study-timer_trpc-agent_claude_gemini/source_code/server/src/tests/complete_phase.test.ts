import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { type CompletePhaseInput } from '../schema';
import { completePhase } from '../handlers/complete_phase';
import { eq, and, isNull } from 'drizzle-orm';

describe('completePhase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete a work phase successfully without interruption', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: true,
        current_phase: 'work',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Create an active log entry
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: null,
        was_interrupted: false
      })
      .execute();

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    const result = await completePhase(input);

    // Verify session updates
    expect(result.id).toEqual(session.id);
    expect(result.is_active).toBe(false);
    expect(result.current_phase).toBe('idle');
    expect(result.phase_start_time).toBeNull();
    expect(result.completed_pomodoros).toBe(1); // Should increment for completed work phase
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should complete a work phase with interruption (no pomodoro increment)', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 2,
        is_active: true,
        current_phase: 'work',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Create an active log entry
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: null,
        was_interrupted: false
      })
      .execute();

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: true
    };

    const result = await completePhase(input);

    // Verify session updates
    expect(result.completed_pomodoros).toBe(2); // Should NOT increment for interrupted work phase
    expect(result.is_active).toBe(false);
    expect(result.current_phase).toBe('idle');
  });

  it('should complete a break phase without affecting pomodoro count', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 1,
        is_active: true,
        current_phase: 'short_break',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Create an active log entry for break
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'short_break',
        duration_minutes: 5,
        started_at: new Date(),
        completed_at: null,
        was_interrupted: false
      })
      .execute();

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    const result = await completePhase(input);

    // Verify session updates
    expect(result.completed_pomodoros).toBe(1); // Should stay the same for break phases
    expect(result.is_active).toBe(false);
    expect(result.current_phase).toBe('idle');
  });

  it('should update the log entry with completion time and interruption status', async () => {
    // Create a session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: true,
        current_phase: 'work',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Create an active log entry
    const logResult = await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: null,
        was_interrupted: false
      })
      .returning()
      .execute();

    const logEntry = logResult[0];

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: true
    };

    await completePhase(input);

    // Verify log entry was updated
    const updatedLog = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.id, logEntry.id))
      .execute();

    expect(updatedLog).toHaveLength(1);
    expect(updatedLog[0].completed_at).toBeInstanceOf(Date);
    expect(updatedLog[0].was_interrupted).toBe(true);
  });

  it('should throw error when session does not exist', async () => {
    const input: CompletePhaseInput = {
      session_id: 999, // Non-existent session
      was_interrupted: false
    };

    await expect(completePhase(input)).rejects.toThrow(/Session with id 999 not found/i);
  });

  it('should throw error when session is not active', async () => {
    // Create an inactive session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: false, // Not active
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    await expect(completePhase(input)).rejects.toThrow(/Session .* is not currently active/i);
  });

  it('should throw error when session is in idle phase', async () => {
    // Create a session in idle phase
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: true,
        current_phase: 'idle', // Idle phase
        phase_start_time: null
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    await expect(completePhase(input)).rejects.toThrow(/Session .* is in idle phase, nothing to complete/i);
  });

  it('should throw error when no active log entry exists', async () => {
    // Create an active session
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: true,
        current_phase: 'work',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Don't create any log entry, or create one that's already completed
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'work',
        duration_minutes: 25,
        started_at: new Date(),
        completed_at: new Date(), // Already completed
        was_interrupted: false
      })
      .execute();

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    await expect(completePhase(input)).rejects.toThrow(/No active log entry found for session/i);
  });

  it('should handle long break phase completion correctly', async () => {
    // Create a session in long break phase
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4,
        completed_pomodoros: 4,
        is_active: true,
        current_phase: 'long_break',
        phase_start_time: new Date()
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    // Create an active long break log entry
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: session.id,
        phase_type: 'long_break',
        duration_minutes: 15,
        started_at: new Date(),
        completed_at: null,
        was_interrupted: false
      })
      .execute();

    const input: CompletePhaseInput = {
      session_id: session.id,
      was_interrupted: false
    };

    const result = await completePhase(input);

    // Verify session updates
    expect(result.completed_pomodoros).toBe(4); // Should stay the same for break phases
    expect(result.is_active).toBe(false);
    expect(result.current_phase).toBe('idle');
    expect(result.phase_start_time).toBeNull();
  });
});
