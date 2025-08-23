import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type UpdatePomodoroSessionInput } from '../schema';
import { updatePomodoroSession } from '../handlers/update_session';
import { eq } from 'drizzle-orm';

/**
 * Helper to create a pomodoro session directly via DB for testing.
 */
const createTestSession = async () => {
  const [session] = await db
    .insert(pomodoroSessionsTable)
    .values({
      type: 'work',
      duration_minutes: 25,
      started_at: new Date('2023-01-01T00:00:00Z'),
      completed: false,
    })
    .returning()
    .execute();
  return session;
};

describe('updatePomodoroSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update ended_at and completed fields', async () => {
    const session = await createTestSession();
    const newEnd = new Date('2023-01-01T00:25:00Z');
    const input: UpdatePomodoroSessionInput = {
      id: session.id,
      ended_at: newEnd,
      completed: true,
    };

    const updated = await updatePomodoroSession(input);

    expect(updated.id).toBe(session.id);
    expect(updated.ended_at?.getTime()).toBe(newEnd.getTime());
    expect(updated.completed).toBe(true);
    // Ensure other fields stay unchanged
    expect(updated.type).toBe(session.type);
    expect(updated.duration_minutes).toBe(session.duration_minutes);
    expect(updated.started_at.getTime()).toBe(session.started_at.getTime());

    // Verify persistence in DB
    const [dbRecord] = await db
      .select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, session.id))
      .execute();
    expect(dbRecord.ended_at?.getTime()).toBe(newEnd.getTime());
    expect(dbRecord.completed).toBe(true);
  });

  it('should update only provided fields', async () => {
    const session = await createTestSession();
    const input: UpdatePomodoroSessionInput = {
      id: session.id,
      completed: true,
    };
    const updated = await updatePomodoroSession(input);
    expect(updated.completed).toBe(true);
    expect(updated.ended_at).toBeNull(); // unchanged, should stay null
  });

  it('should throw an error for non‑existent session', async () => {
    const input: UpdatePomodoroSessionInput = {
      id: 9999,
      completed: true,
    };
    await expect(updatePomodoroSession(input)).rejects.toThrow(/not found/i);
  });
});
