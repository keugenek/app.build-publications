import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studySessionsTable } from '../db/schema';
import { type LogSessionInput } from '../schema';
import { logStudySession } from '../handlers/log_study_session';
import { eq } from 'drizzle-orm';

// Test input for logging sessions
const testInput: LogSessionInput = {
  date: '2024-01-15'
};

describe('logStudySession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new session record for a new date', async () => {
    const result = await logStudySession(testInput);

    // Verify basic fields
    expect(result.date).toEqual('2024-01-15');
    expect(result.completed_sessions).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save session to database correctly', async () => {
    const result = await logStudySession(testInput);

    // Query database to verify persistence
    const sessions = await db.select()
      .from(studySessionsTable)
      .where(eq(studySessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].date).toEqual('2024-01-15');
    expect(sessions[0].completed_sessions).toEqual(1);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
    expect(sessions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should increment completed_sessions for existing date', async () => {
    // Log first session
    const firstResult = await logStudySession(testInput);
    expect(firstResult.completed_sessions).toEqual(1);

    // Log second session for same date
    const secondResult = await logStudySession(testInput);
    expect(secondResult.completed_sessions).toEqual(2);
    expect(secondResult.id).toEqual(firstResult.id); // Same record

    // Log third session for same date
    const thirdResult = await logStudySession(testInput);
    expect(thirdResult.completed_sessions).toEqual(3);
    expect(thirdResult.id).toEqual(firstResult.id); // Same record
  });

  it('should handle multiple dates separately', async () => {
    // Log session for first date
    const firstDate = await logStudySession({ date: '2024-01-15' });
    expect(firstDate.completed_sessions).toEqual(1);

    // Log session for second date
    const secondDate = await logStudySession({ date: '2024-01-16' });
    expect(secondDate.completed_sessions).toEqual(1);
    expect(secondDate.id).not.toEqual(firstDate.id); // Different records

    // Log another session for first date
    const firstDateAgain = await logStudySession({ date: '2024-01-15' });
    expect(firstDateAgain.completed_sessions).toEqual(2);
    expect(firstDateAgain.id).toEqual(firstDate.id); // Same record as first
  });

  it('should update timestamps correctly on increment', async () => {
    // Log first session and capture timestamp
    const firstResult = await logStudySession(testInput);
    const firstUpdatedAt = firstResult.updated_at;

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Log second session for same date
    const secondResult = await logStudySession(testInput);
    
    expect(secondResult.updated_at).toBeInstanceOf(Date);
    expect(secondResult.updated_at.getTime()).toBeGreaterThan(firstUpdatedAt.getTime());
    expect(secondResult.completed_sessions).toEqual(2);
  });

  it('should verify database state after multiple operations', async () => {
    // Log sessions for different dates
    await logStudySession({ date: '2024-01-15' });
    await logStudySession({ date: '2024-01-15' });
    await logStudySession({ date: '2024-01-16' });

    // Query all sessions from database
    const allSessions = await db.select()
      .from(studySessionsTable)
      .execute();

    expect(allSessions).toHaveLength(2); // Two distinct dates

    // Find sessions by date
    const jan15Sessions = allSessions.filter(s => s.date === '2024-01-15');
    const jan16Sessions = allSessions.filter(s => s.date === '2024-01-16');

    expect(jan15Sessions).toHaveLength(1);
    expect(jan15Sessions[0].completed_sessions).toEqual(2);

    expect(jan16Sessions).toHaveLength(1);
    expect(jan16Sessions[0].completed_sessions).toEqual(1);
  });
});
