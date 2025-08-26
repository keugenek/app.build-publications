import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type CreatePomodoroSessionInput, type PomodoroSession } from '../schema';
import { createPomodoroSession } from '../handlers/create_session';
import { eq } from 'drizzle-orm';

// Test input for creating a pomodoro session
const testInput: CreatePomodoroSessionInput = {
  type: 'work',
  duration_minutes: 25,
};

describe('createPomodoroSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a session and return the created record', async () => {
    const result = await createPomodoroSession(testInput);

    // Validate returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.type).toBe('work');
    expect(result.duration_minutes).toBe(25);
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
    expect(result.completed).toBe(false);

    // Verify the session exists in the database
    const rows = await db
      .select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbRow = rows[0] as PomodoroSession;
    expect(dbRow.type).toBe('work');
    expect(dbRow.duration_minutes).toBe(25);
    expect(dbRow.started_at).toBeInstanceOf(Date);
    expect(dbRow.ended_at).toBeNull();
    expect(dbRow.completed).toBe(false);
  });
});
