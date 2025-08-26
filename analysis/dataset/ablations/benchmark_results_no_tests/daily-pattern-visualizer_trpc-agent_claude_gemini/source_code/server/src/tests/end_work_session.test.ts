import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type EndWorkSessionInput } from '../schema';
import { endWorkSession } from '../handlers/end_work_session';
import { eq, isNull, and } from 'drizzle-orm';

describe('endWorkSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should end an ongoing work session', async () => {
    // Create an ongoing work session (end_time = null)
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: now.toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        start_time: startTime,
        end_time: null, // Ongoing session
        is_break: false
      })
      .returning()
      .execute();

    const sessionId = insertResult[0].id;

    const input: EndWorkSessionInput = {
      id: sessionId
    };

    // End the work session
    const result = await endWorkSession(input);

    // Verify the result
    expect(result.id).toEqual(sessionId);
    expect(result.end_time).toBeInstanceOf(Date);
    expect(result.end_time).not.toBeNull();
    expect(result.start_time).toEqual(startTime);
    expect(result.is_break).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.date).toBeInstanceOf(Date);

    // Verify the session duration makes sense (should be positive)
    const duration = result.end_time!.getTime() - result.start_time.getTime();
    expect(duration).toBeGreaterThan(0);
  });

  it('should save ended session to database', async () => {
    // Create an ongoing work session
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: now.toISOString().split('T')[0],
        start_time: startTime,
        end_time: null,
        is_break: true // This time it's a break session
      })
      .returning()
      .execute();

    const sessionId = insertResult[0].id;

    const input: EndWorkSessionInput = {
      id: sessionId
    };

    await endWorkSession(input);

    // Query the database to verify the session was updated
    const sessions = await db.select()
      .from(workSessionsTable)
      .where(eq(workSessionsTable.id, sessionId))
      .execute();

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.end_time).not.toBeNull();
    expect(session.end_time).toBeInstanceOf(Date);
    expect(session.is_break).toEqual(true);
    expect(session.start_time).toEqual(startTime);
  });

  it('should throw error when session does not exist', async () => {
    const input: EndWorkSessionInput = {
      id: 999999 // Non-existent session ID
    };

    expect(endWorkSession(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when session is already ended', async () => {
    // Create a session that's already ended
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: now.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime, // Already ended
        is_break: false
      })
      .returning()
      .execute();

    const sessionId = insertResult[0].id;

    const input: EndWorkSessionInput = {
      id: sessionId
    };

    expect(endWorkSession(input)).rejects.toThrow(/already ended/i);
  });

  it('should preserve all original session data', async () => {
    // Create an ongoing break session with specific data
    const specificDate = new Date('2024-01-15');
    const startTime = new Date('2024-01-15T14:30:00Z');
    
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: startTime,
        end_time: null,
        is_break: true
      })
      .returning()
      .execute();

    const sessionId = insertResult[0].id;
    const originalCreatedAt = insertResult[0].created_at;

    const input: EndWorkSessionInput = {
      id: sessionId
    };

    const result = await endWorkSession(input);

    // Verify all original data is preserved
    expect(result.id).toEqual(sessionId);
    expect(result.date).toEqual(specificDate);
    expect(result.start_time).toEqual(startTime);
    expect(result.is_break).toEqual(true);
    expect(result.created_at).toEqual(originalCreatedAt);
    
    // Only end_time should be newly set
    expect(result.end_time).toBeInstanceOf(Date);
    expect(result.end_time).not.toBeNull();
  });

  it('should verify ongoing sessions are properly filtered', async () => {
    const now = new Date();
    
    // Create multiple sessions - some ongoing, some ended
    const sessions = await Promise.all([
      // Ongoing session 1
      db.insert(workSessionsTable)
        .values({
          date: now.toISOString().split('T')[0],
          start_time: new Date(now.getTime() - 60 * 60 * 1000),
          end_time: null,
          is_break: false
        })
        .returning()
        .execute(),
      
      // Ended session
      db.insert(workSessionsTable)
        .values({
          date: now.toISOString().split('T')[0],
          start_time: new Date(now.getTime() - 120 * 60 * 1000),
          end_time: new Date(now.getTime() - 60 * 60 * 1000),
          is_break: false
        })
        .returning()
        .execute(),
      
      // Ongoing session 2
      db.insert(workSessionsTable)
        .values({
          date: now.toISOString().split('T')[0],
          start_time: new Date(now.getTime() - 30 * 60 * 1000),
          end_time: null,
          is_break: true
        })
        .returning()
        .execute()
    ]);

    const ongoingSession1Id = sessions[0][0].id;
    const endedSessionId = sessions[1][0].id;
    const ongoingSession2Id = sessions[2][0].id;

    // End one of the ongoing sessions
    await endWorkSession({ id: ongoingSession1Id });

    // Verify that only the correct session was ended
    const allSessions = await db.select()
      .from(workSessionsTable)
      .execute();

    const session1 = allSessions.find(s => s.id === ongoingSession1Id);
    const endedSession = allSessions.find(s => s.id === endedSessionId);
    const session2 = allSessions.find(s => s.id === ongoingSession2Id);

    expect(session1?.end_time).not.toBeNull(); // Should now be ended
    expect(endedSession?.end_time).not.toBeNull(); // Was already ended
    expect(session2?.end_time).toBeNull(); // Should still be ongoing
  });
});
