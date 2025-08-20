import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { type CreateTimerSessionInput } from '../schema';
import { createTimerSession } from '../handlers/create_timer_session';
import { eq, gte } from 'drizzle-orm';

// Test input for work session
const testWorkInput: CreateTimerSessionInput = {
  session_type: 'work',
  duration_minutes: 25
};

// Test input for break session
const testBreakInput: CreateTimerSessionInput = {
  session_type: 'break',
  duration_minutes: 5
};

describe('createTimerSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a work timer session', async () => {
    const result = await createTimerSession(testWorkInput);

    // Basic field validation
    expect(result.session_type).toEqual('work');
    expect(result.duration_minutes).toEqual(25);
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a break timer session', async () => {
    const result = await createTimerSession(testBreakInput);

    // Basic field validation
    expect(result.session_type).toEqual('break');
    expect(result.duration_minutes).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save timer session to database', async () => {
    const result = await createTimerSession(testWorkInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(timerSessionsTable)
      .where(eq(timerSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].session_type).toEqual('work');
    expect(sessions[0].duration_minutes).toEqual(25);
    expect(sessions[0].completed_at).toBeInstanceOf(Date);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should set completed_at timestamp to current time', async () => {
    const beforeCreation = new Date();
    const result = await createTimerSession(testWorkInput);
    const afterCreation = new Date();

    // Verify completed_at is set to current time (within reasonable range)
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.completed_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should query sessions by completion date correctly', async () => {
    // Create test sessions
    await createTimerSession(testWorkInput);
    await createTimerSession(testBreakInput);

    // Test date filtering
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Query sessions completed today or later
    const sessions = await db.select()
      .from(timerSessionsTable)
      .where(gte(timerSessionsTable.completed_at, yesterday))
      .execute();

    expect(sessions.length).toBeGreaterThan(0);
    sessions.forEach(session => {
      expect(session.completed_at).toBeInstanceOf(Date);
      expect(session.completed_at >= yesterday).toBe(true);
    });
  });

  it('should create multiple sessions with different types', async () => {
    // Create multiple sessions
    const workSession = await createTimerSession(testWorkInput);
    const breakSession = await createTimerSession(testBreakInput);

    // Verify both sessions were created with different IDs
    expect(workSession.id).not.toEqual(breakSession.id);
    expect(workSession.session_type).toEqual('work');
    expect(breakSession.session_type).toEqual('break');

    // Verify both exist in database
    const allSessions = await db.select()
      .from(timerSessionsTable)
      .execute();

    expect(allSessions).toHaveLength(2);
    const sessionTypes = allSessions.map(s => s.session_type);
    expect(sessionTypes).toContain('work');
    expect(sessionTypes).toContain('break');
  });

  it('should handle custom duration values', async () => {
    const customInput: CreateTimerSessionInput = {
      session_type: 'work',
      duration_minutes: 45 // Custom duration
    };

    const result = await createTimerSession(customInput);

    expect(result.duration_minutes).toEqual(45);
    expect(result.session_type).toEqual('work');
  });
});
