import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { type StartPhaseInput, type CreatePomodoroSessionInput } from '../schema';
import { startPhase } from '../handlers/start_phase';
import { eq } from 'drizzle-orm';

// Test session input
const testSessionInput: CreatePomodoroSessionInput = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  long_break_interval: 4
};

describe('startPhase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should start a work phase successfully', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: testSessionInput.work_duration,
        short_break_duration: testSessionInput.short_break_duration,
        long_break_duration: testSessionInput.long_break_duration,
        long_break_interval: testSessionInput.long_break_interval,
        completed_pomodoros: 0,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const input: StartPhaseInput = {
      session_id: sessionId,
      phase_type: 'work'
    };

    const result = await startPhase(input);

    // Verify session was updated correctly
    expect(result.id).toEqual(sessionId);
    expect(result.current_phase).toEqual('work');
    expect(result.is_active).toEqual(true);
    expect(result.phase_start_time).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.work_duration).toEqual(25);
  });

  it('should start a short break phase successfully', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: testSessionInput.work_duration,
        short_break_duration: testSessionInput.short_break_duration,
        long_break_duration: testSessionInput.long_break_duration,
        long_break_interval: testSessionInput.long_break_interval,
        completed_pomodoros: 1,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const input: StartPhaseInput = {
      session_id: sessionId,
      phase_type: 'short_break'
    };

    const result = await startPhase(input);

    // Verify session was updated correctly
    expect(result.current_phase).toEqual('short_break');
    expect(result.is_active).toEqual(true);
    expect(result.phase_start_time).toBeInstanceOf(Date);
  });

  it('should start a long break phase successfully', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: testSessionInput.work_duration,
        short_break_duration: testSessionInput.short_break_duration,
        long_break_duration: testSessionInput.long_break_duration,
        long_break_interval: testSessionInput.long_break_interval,
        completed_pomodoros: 4,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const input: StartPhaseInput = {
      session_id: sessionId,
      phase_type: 'long_break'
    };

    const result = await startPhase(input);

    // Verify session was updated correctly
    expect(result.current_phase).toEqual('long_break');
    expect(result.is_active).toEqual(true);
    expect(result.phase_start_time).toBeInstanceOf(Date);
  });

  it('should create a log entry when starting a phase', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: testSessionInput.work_duration,
        short_break_duration: testSessionInput.short_break_duration,
        long_break_duration: testSessionInput.long_break_duration,
        long_break_interval: testSessionInput.long_break_interval,
        completed_pomodoros: 0,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const input: StartPhaseInput = {
      session_id: sessionId,
      phase_type: 'work'
    };

    await startPhase(input);

    // Verify log entry was created
    const logEntries = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .execute();

    expect(logEntries).toHaveLength(1);
    expect(logEntries[0].phase_type).toEqual('work');
    expect(logEntries[0].duration_minutes).toEqual(25);
    expect(logEntries[0].started_at).toBeInstanceOf(Date);
    expect(logEntries[0].completed_at).toBeNull();
    expect(logEntries[0].was_interrupted).toEqual(false);
  });

  it('should set correct duration for each phase type', async () => {
    // Create a test session with custom durations
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        long_break_interval: 4,
        completed_pomodoros: 0,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Test work phase duration
    await startPhase({ session_id: sessionId, phase_type: 'work' });
    let logEntries = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .execute();
    expect(logEntries[0].duration_minutes).toEqual(30);

    // Test short break duration
    await startPhase({ session_id: sessionId, phase_type: 'short_break' });
    logEntries = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .execute();
    expect(logEntries[1].duration_minutes).toEqual(10);

    // Test long break duration
    await startPhase({ session_id: sessionId, phase_type: 'long_break' });
    logEntries = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .execute();
    expect(logEntries[2].duration_minutes).toEqual(20);
  });

  it('should update session in database', async () => {
    // Create a test session first
    const sessionResult = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: testSessionInput.work_duration,
        short_break_duration: testSessionInput.short_break_duration,
        long_break_duration: testSessionInput.long_break_duration,
        long_break_interval: testSessionInput.long_break_interval,
        completed_pomodoros: 2,
        is_active: false,
        current_phase: 'idle',
        phase_start_time: null
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const input: StartPhaseInput = {
      session_id: sessionId,
      phase_type: 'short_break'
    };

    await startPhase(input);

    // Query database directly to verify update
    const updatedSession = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    expect(updatedSession).toHaveLength(1);
    expect(updatedSession[0].current_phase).toEqual('short_break');
    expect(updatedSession[0].is_active).toEqual(true);
    expect(updatedSession[0].phase_start_time).toBeInstanceOf(Date);
    expect(updatedSession[0].updated_at).toBeInstanceOf(Date);
    expect(updatedSession[0].completed_pomodoros).toEqual(2); // Should remain unchanged
  });

  it('should throw error for non-existent session', async () => {
    const input: StartPhaseInput = {
      session_id: 999, // Non-existent session ID
      phase_type: 'work'
    };

    expect(startPhase(input)).rejects.toThrow(/session.*not found/i);
  });
});
