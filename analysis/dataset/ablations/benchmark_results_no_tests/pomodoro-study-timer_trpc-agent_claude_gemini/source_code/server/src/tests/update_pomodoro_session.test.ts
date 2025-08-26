import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type UpdatePomodoroSessionInput, type CreatePomodoroSessionInput } from '../schema';
import { updatePomodoroSession } from '../handlers/update_pomodoro_session';
import { eq } from 'drizzle-orm';

// Helper function to create a test session
const createTestSession = async (input: CreatePomodoroSessionInput = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  long_break_interval: 4
}) => {
  const result = await db.insert(pomodoroSessionsTable)
    .values({
      work_duration: input.work_duration,
      short_break_duration: input.short_break_duration,
      long_break_duration: input.long_break_duration,
      long_break_interval: input.long_break_interval,
      completed_pomodoros: 0,
      is_active: false,
      current_phase: 'idle',
      phase_start_time: null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updatePomodoroSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all session settings', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      work_duration: 30,
      short_break_duration: 10,
      long_break_duration: 20,
      long_break_interval: 3
    };

    const result = await updatePomodoroSession(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(session.id);
    expect(result.work_duration).toEqual(30);
    expect(result.short_break_duration).toEqual(10);
    expect(result.long_break_duration).toEqual(20);
    expect(result.long_break_interval).toEqual(3);
    
    // Verify unchanged fields
    expect(result.completed_pomodoros).toEqual(session.completed_pomodoros);
    expect(result.is_active).toEqual(session.is_active);
    expect(result.current_phase).toEqual(session.current_phase);
    expect(result.created_at).toEqual(session.created_at);
    
    // Verify updated_at was changed
    expect(result.updated_at > session.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      work_duration: 35
    };

    const result = await updatePomodoroSession(updateInput);

    // Verify only work_duration was updated
    expect(result.work_duration).toEqual(35);
    expect(result.short_break_duration).toEqual(session.short_break_duration);
    expect(result.long_break_duration).toEqual(session.long_break_duration);
    expect(result.long_break_interval).toEqual(session.long_break_interval);
    
    // Verify updated_at was changed
    expect(result.updated_at > session.updated_at).toBe(true);
  });

  it('should update multiple fields while keeping others unchanged', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      work_duration: 40,
      long_break_interval: 5
    };

    const result = await updatePomodoroSession(updateInput);

    // Verify specified fields were updated
    expect(result.work_duration).toEqual(40);
    expect(result.long_break_interval).toEqual(5);
    
    // Verify unspecified fields remained the same
    expect(result.short_break_duration).toEqual(session.short_break_duration);
    expect(result.long_break_duration).toEqual(session.long_break_duration);
  });

  it('should persist changes to database', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      work_duration: 45,
      short_break_duration: 8
    };

    await updatePomodoroSession(updateInput);

    // Query database directly to verify persistence
    const updatedSessions = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, session.id))
      .execute();

    expect(updatedSessions).toHaveLength(1);
    const dbSession = updatedSessions[0];
    expect(dbSession.work_duration).toEqual(45);
    expect(dbSession.short_break_duration).toEqual(8);
    expect(dbSession.long_break_duration).toEqual(session.long_break_duration);
    expect(dbSession.long_break_interval).toEqual(session.long_break_interval);
  });

  it('should throw error when session does not exist', async () => {
    const updateInput: UpdatePomodoroSessionInput = {
      id: 99999, // Non-existent ID
      work_duration: 25
    };

    await expect(updatePomodoroSession(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle updating session with active state', async () => {
    // Create an active session
    const activeSession = await db.insert(pomodoroSessionsTable)
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

    const updateInput: UpdatePomodoroSessionInput = {
      id: activeSession[0].id,
      work_duration: 50
    };

    const result = await updatePomodoroSession(updateInput);

    // Verify settings were updated while preserving active state
    expect(result.work_duration).toEqual(50);
    expect(result.is_active).toEqual(true);
    expect(result.current_phase).toEqual('work');
    expect(result.completed_pomodoros).toEqual(2);
    expect(result.phase_start_time).toEqual(activeSession[0].phase_start_time);
  });

  it('should update with minimum valid values', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      work_duration: 1,
      short_break_duration: 1,
      long_break_duration: 1,
      long_break_interval: 1
    };

    const result = await updatePomodoroSession(updateInput);

    expect(result.work_duration).toEqual(1);
    expect(result.short_break_duration).toEqual(1);
    expect(result.long_break_duration).toEqual(1);
    expect(result.long_break_interval).toEqual(1);
  });

  it('should handle updating only break durations', async () => {
    // Create a test session
    const session = await createTestSession();
    
    const updateInput: UpdatePomodoroSessionInput = {
      id: session.id,
      short_break_duration: 7,
      long_break_duration: 25
    };

    const result = await updatePomodoroSession(updateInput);

    // Verify break durations were updated
    expect(result.short_break_duration).toEqual(7);
    expect(result.long_break_duration).toEqual(25);
    
    // Verify work duration and interval remained unchanged
    expect(result.work_duration).toEqual(session.work_duration);
    expect(result.long_break_interval).toEqual(session.long_break_interval);
  });
});
