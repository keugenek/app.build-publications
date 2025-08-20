import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type StartWorkSessionInput } from '../schema';
import { startWorkSession } from '../handlers/start_work_session';
import { isNull, eq } from 'drizzle-orm';

// Test inputs
const workSessionInput: StartWorkSessionInput = {
  is_break: false
};

const breakSessionInput: StartWorkSessionInput = {
  is_break: true
};

describe('startWorkSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a work session', async () => {
    const result = await startWorkSession(workSessionInput);

    // Basic field validation
    expect(result.is_break).toEqual(false);
    expect(result.end_time).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.date).toBeInstanceOf(Date);
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify date is today
    const today = new Date().toISOString().split('T')[0];
    const resultDate = result.date.toISOString().split('T')[0];
    expect(resultDate).toEqual(today);
  });

  it('should create a break session', async () => {
    const result = await startWorkSession(breakSessionInput);

    expect(result.is_break).toEqual(true);
    expect(result.end_time).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save session to database', async () => {
    const result = await startWorkSession(workSessionInput);

    // Query database to verify session was saved
    const sessions = await db.select()
      .from(workSessionsTable)
      .where(eq(workSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].is_break).toEqual(false);
    expect(sessions[0].end_time).toBeNull();
    expect(sessions[0].start_time).toBeInstanceOf(Date);
  });

  it('should end ongoing sessions before starting new one', async () => {
    // Start first session
    const firstSession = await startWorkSession(workSessionInput);
    expect(firstSession.end_time).toBeNull();

    // Start second session - should end the first one
    const secondSession = await startWorkSession(breakSessionInput);
    expect(secondSession.end_time).toBeNull();

    // Verify first session was ended
    const updatedFirstSession = await db.select()
      .from(workSessionsTable)
      .where(eq(workSessionsTable.id, firstSession.id))
      .execute();

    expect(updatedFirstSession[0].end_time).not.toBeNull();
    expect(updatedFirstSession[0].end_time).toBeInstanceOf(Date);

    // Verify second session is still ongoing
    const ongoingSessions = await db.select()
      .from(workSessionsTable)
      .where(isNull(workSessionsTable.end_time))
      .execute();

    expect(ongoingSessions).toHaveLength(1);
    expect(ongoingSessions[0].id).toEqual(secondSession.id);
  });

  it('should handle multiple ongoing sessions correctly', async () => {
    // Manually insert multiple ongoing sessions to test edge case
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    await db.insert(workSessionsTable)
      .values([
        {
          date: today,
          start_time: new Date(now.getTime() - 3600000), // 1 hour ago
          end_time: null,
          is_break: false
        },
        {
          date: today,
          start_time: new Date(now.getTime() - 1800000), // 30 minutes ago
          end_time: null,
          is_break: true
        }
      ])
      .execute();

    // Verify we have 2 ongoing sessions
    let ongoingSessions = await db.select()
      .from(workSessionsTable)
      .where(isNull(workSessionsTable.end_time))
      .execute();
    expect(ongoingSessions).toHaveLength(2);

    // Start new session - should end all ongoing sessions
    const newSession = await startWorkSession(workSessionInput);

    // Verify only 1 ongoing session remains (the new one)
    ongoingSessions = await db.select()
      .from(workSessionsTable)
      .where(isNull(workSessionsTable.end_time))
      .execute();

    expect(ongoingSessions).toHaveLength(1);
    expect(ongoingSessions[0].id).toEqual(newSession.id);

    // Verify all previous sessions were ended
    const allSessions = await db.select()
      .from(workSessionsTable)
      .execute();
    
    const sessionsWithEndTime = allSessions.filter(s => s.end_time !== null);
    expect(sessionsWithEndTime).toHaveLength(2); // The 2 previous sessions
  });

  it('should set correct timestamps', async () => {
    const beforeStart = new Date();
    const result = await startWorkSession(workSessionInput);
    const afterStart = new Date();

    // start_time should be between before and after timestamps
    expect(result.start_time.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
    expect(result.start_time.getTime()).toBeLessThanOrEqual(afterStart.getTime());

    // created_at should also be in the same range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterStart.getTime());
  });
});
