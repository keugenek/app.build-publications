import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { type CreateSessionInput } from '../schema';
import { createSession } from '../handlers/create_session';
import { eq } from 'drizzle-orm';

// Test inputs for different session types
const workSessionInput: CreateSessionInput = {
  type: 'work',
  duration: 25
};

const breakSessionInput: CreateSessionInput = {
  type: 'break',
  duration: 5
};

const longWorkSessionInput: CreateSessionInput = {
  type: 'work',
  duration: 90
};

describe('createSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a work session', async () => {
    const result = await createSession(workSessionInput);

    // Basic field validation
    expect(result.type).toEqual('work');
    expect(result.duration).toEqual(25);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should create a break session', async () => {
    const result = await createSession(breakSessionInput);

    // Basic field validation
    expect(result.type).toEqual('break');
    expect(result.duration).toEqual(5);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should create a long work session', async () => {
    const result = await createSession(longWorkSessionInput);

    // Verify long duration is handled correctly
    expect(result.type).toEqual('work');
    expect(result.duration).toEqual(90);
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should save session to database', async () => {
    const result = await createSession(workSessionInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].type).toEqual('work');
    expect(sessions[0].duration).toEqual(25);
    expect(sessions[0].completed_at).toBeInstanceOf(Date);
  });

  it('should set completed_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createSession(workSessionInput);
    const afterCreation = new Date();

    // Verify timestamp is within reasonable range (should be very close to current time)
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.completed_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple sessions with different IDs', async () => {
    const session1 = await createSession(workSessionInput);
    const session2 = await createSession(breakSessionInput);
    const session3 = await createSession(longWorkSessionInput);

    // Each session should have unique ID
    expect(session1.id).not.toEqual(session2.id);
    expect(session1.id).not.toEqual(session3.id);
    expect(session2.id).not.toEqual(session3.id);

    // Verify all sessions are saved
    const allSessions = await db.select()
      .from(sessionsTable)
      .execute();

    expect(allSessions).toHaveLength(3);
    
    // Check that we have the expected types and durations
    const sessionTypes = allSessions.map(s => s.type).sort();
    const sessionDurations = allSessions.map(s => s.duration).sort((a, b) => a - b);
    
    expect(sessionTypes).toEqual(['break', 'work', 'work']);
    expect(sessionDurations).toEqual([5, 25, 90]);
  });

  it('should handle database persistence correctly', async () => {
    // Create session
    const result = await createSession(breakSessionInput);

    // Verify the session exists in database with correct data
    const dbSession = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, result.id))
      .execute();

    expect(dbSession).toHaveLength(1);
    expect(dbSession[0].id).toEqual(result.id);
    expect(dbSession[0].type).toEqual('break');
    expect(dbSession[0].duration).toEqual(5);
    expect(dbSession[0].completed_at).toBeInstanceOf(Date);
    
    // Verify returned data matches database data
    expect(result.id).toEqual(dbSession[0].id);
    expect(result.type).toEqual(dbSession[0].type as 'work' | 'break');
    expect(result.duration).toEqual(dbSession[0].duration);
    expect(result.completed_at.getTime()).toEqual(dbSession[0].completed_at.getTime());
  });
});
