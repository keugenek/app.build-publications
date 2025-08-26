import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { type CreatePomodoroLogInput } from '../schema';
import { createPomodoroLog } from '../handlers/create_pomodoro_log';
import { eq } from 'drizzle-orm';

const testInput: CreatePomodoroLogInput = {
  work_duration: 25,
  break_duration: 5,
};

describe('createPomodoroLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pomodoro log and return correct fields', async () => {
    const result = await createPomodoroLog(testInput);

    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.work_duration).toBe(testInput.work_duration);
    expect(result.break_duration).toBe(testInput.break_duration);
    expect(result.started_at).toBeInstanceOf(Date);
    // started_at should be recent (within 2 seconds)
    const now = Date.now();
    const diff = Math.abs(now - result.started_at.getTime());
    expect(diff).toBeLessThanOrEqual(2000);
  });

  it('should persist the log in the database', async () => {
    const result = await createPomodoroLog(testInput);

    const rows = await db
      .select()
      .from(pomodoroLogTable)
      .where(eq(pomodoroLogTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.work_duration).toBe(testInput.work_duration);
    expect(row.break_duration).toBe(testInput.break_duration);
    expect(row.started_at).toBeInstanceOf(Date);
  });
});
