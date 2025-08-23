import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { getPomodoroSessions } from '../handlers/get_sessions';
import { eq } from 'drizzle-orm';

// Helper to create a pomodoro session directly in the DB
const createSession = async (overrides = {}) => {
  const now = new Date();
  const [session] = await db
    .insert(pomodoroSessionsTable)
    .values({
      type: 'work',
      duration_minutes: 25,
      started_at: now,
      // ended_at omitted (null)
      // completed uses default false
      ...overrides,
    })
    .returning()
    .execute();
  return session;
};

describe('getPomodoroSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no sessions exist', async () => {
    const sessions = await getPomodoroSessions();
    expect(Array.isArray(sessions)).toBeTrue();
    expect(sessions).toHaveLength(0);
  });

  it('should fetch all pomodoro sessions from the database', async () => {
    // Insert two sessions with different data
    const session1 = await createSession({
      type: 'work',
      duration_minutes: 25,
    });
    const session2 = await createSession({
      type: 'break',
      duration_minutes: 5,
    });

    const sessions = await getPomodoroSessions();
    // Verify we got both sessions
    expect(sessions).toHaveLength(2);
    // Find by id to ensure correct data
    const fetched1 = sessions.find((s) => s.id === session1.id);
    const fetched2 = sessions.find((s) => s.id === session2.id);
    expect(fetched1).toBeDefined();
    expect(fetched2).toBeDefined();
    // Basic field checks
    expect(fetched1?.type).toBe('work');
    expect(fetched1?.duration_minutes).toBe(25);
    expect(fetched1?.completed).toBe(false);
    expect(fetched1?.started_at).toBeInstanceOf(Date);
    expect(fetched2?.type).toBe('break');
    expect(fetched2?.duration_minutes).toBe(5);
  });
});
