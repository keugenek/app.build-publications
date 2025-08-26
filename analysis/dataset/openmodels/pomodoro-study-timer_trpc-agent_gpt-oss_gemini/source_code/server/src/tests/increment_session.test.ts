import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { incrementSession } from '../handlers/increment_session';
import { eq } from 'drizzle-orm';

describe('incrementSession handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a log entry when none exists', async () => {
    const testDate = '2025-01-01';
    await incrementSession({ date: testDate });

    const rows = await db
      .select()
      .from(pomodoroLogTable)
      .where(eq(pomodoroLogTable.date, testDate))
      .execute();

    expect(rows).toHaveLength(1);
    expect(rows[0].sessions_completed).toBe(1);
  });

  it('should increment sessions when entry exists', async () => {
    const testDate = '2025-01-02';
    // Insert initial log
    await db
      .insert(pomodoroLogTable)
      .values({ date: testDate, sessions_completed: 2 })
      .execute();

    await incrementSession({ date: testDate });

    const rows = await db
      .select()
      .from(pomodoroLogTable)
      .where(eq(pomodoroLogTable.date, testDate))
      .execute();

    expect(rows).toHaveLength(1);
    expect(rows[0].sessions_completed).toBe(3);
  });

  it('should default to today when no date provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    await incrementSession({});

    const rows = await db
      .select()
      .from(pomodoroLogTable)
      .where(eq(pomodoroLogTable.date, today))
      .execute();

    expect(rows).toHaveLength(1);
    expect(rows[0].sessions_completed).toBe(1);
  });
});
