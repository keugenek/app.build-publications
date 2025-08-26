import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type CreatePomodoroSessionInput } from '../schema';
import { createPomodoroSession } from '../handlers/create_pomodoro_session';
import { eq } from 'drizzle-orm';

// Test input with default values
const testInput: CreatePomodoroSessionInput = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  long_break_interval: 4
};

// Test input with custom values
const customInput: CreatePomodoroSessionInput = {
  work_duration: 50,
  short_break_duration: 10,
  long_break_duration: 30,
  long_break_interval: 3
};

describe('createPomodoroSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pomodoro session with default values', async () => {
    const result = await createPomodoroSession(testInput);

    // Validate basic fields
    expect(result.work_duration).toEqual(25);
    expect(result.short_break_duration).toEqual(5);
    expect(result.long_break_duration).toEqual(15);
    expect(result.long_break_interval).toEqual(4);

    // Validate default tracking fields
    expect(result.completed_pomodoros).toEqual(0);
    expect(result.is_active).toEqual(false);
    expect(result.current_phase).toEqual('idle');
    expect(result.phase_start_time).toBeNull();

    // Validate generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a pomodoro session with custom values', async () => {
    const result = await createPomodoroSession(customInput);

    // Validate custom duration values
    expect(result.work_duration).toEqual(50);
    expect(result.short_break_duration).toEqual(10);
    expect(result.long_break_duration).toEqual(30);
    expect(result.long_break_interval).toEqual(3);

    // Default tracking fields should still be set properly
    expect(result.completed_pomodoros).toEqual(0);
    expect(result.is_active).toEqual(false);
    expect(result.current_phase).toEqual('idle');
    expect(result.phase_start_time).toBeNull();
  });

  it('should save pomodoro session to database', async () => {
    const result = await createPomodoroSession(testInput);

    // Query the database directly to verify persistence
    const sessions = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    
    const savedSession = sessions[0];
    expect(savedSession.work_duration).toEqual(25);
    expect(savedSession.short_break_duration).toEqual(5);
    expect(savedSession.long_break_duration).toEqual(15);
    expect(savedSession.long_break_interval).toEqual(4);
    expect(savedSession.completed_pomodoros).toEqual(0);
    expect(savedSession.is_active).toEqual(false);
    expect(savedSession.current_phase).toEqual('idle');
    expect(savedSession.phase_start_time).toBeNull();
    expect(savedSession.created_at).toBeInstanceOf(Date);
    expect(savedSession.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple unique sessions', async () => {
    const session1 = await createPomodoroSession(testInput);
    const session2 = await createPomodoroSession(customInput);

    // Verify they have different IDs
    expect(session1.id).not.toEqual(session2.id);

    // Verify both are persisted
    const allSessions = await db.select()
      .from(pomodoroSessionsTable)
      .execute();

    expect(allSessions).toHaveLength(2);
    
    // Verify different configurations
    const session1Data = allSessions.find(s => s.id === session1.id);
    const session2Data = allSessions.find(s => s.id === session2.id);
    
    expect(session1Data?.work_duration).toEqual(25);
    expect(session2Data?.work_duration).toEqual(50);
  });

  it('should handle sessions with minimum valid durations', async () => {
    const minimalInput: CreatePomodoroSessionInput = {
      work_duration: 1,
      short_break_duration: 1,
      long_break_duration: 1,
      long_break_interval: 1
    };

    const result = await createPomodoroSession(minimalInput);

    expect(result.work_duration).toEqual(1);
    expect(result.short_break_duration).toEqual(1);
    expect(result.long_break_duration).toEqual(1);
    expect(result.long_break_interval).toEqual(1);
    
    // All default tracking fields should still be properly set
    expect(result.completed_pomodoros).toEqual(0);
    expect(result.is_active).toEqual(false);
    expect(result.current_phase).toEqual('idle');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createPomodoroSession(testInput);
    const afterCreation = new Date();

    // Timestamps should be between before and after creation
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // For new sessions, created_at and updated_at should be very close
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});
