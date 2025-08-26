import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { getPomodoroLog } from '../handlers/get_pomodoro_log';

describe('getPomodoroLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all pomodoro logs with correct format', async () => {
    // Insert sample logs
    await db.insert(pomodoroLogTable).values({
      date: '2023-01-01',
      sessions_completed: 3,
    }).execute();
    await db.insert(pomodoroLogTable).values({
      date: '2023-01-02',
      sessions_completed: 5,
    }).execute();

    const logs = await getPomodoroLog();
    expect(logs).toHaveLength(2);
    // Verify fields
    const log1 = logs.find(l => l.date === '2023-01-01');
    expect(log1).toBeDefined();
    expect(log1?.sessions_completed).toBe(3);
    const log2 = logs.find(l => l.date === '2023-01-02');
    expect(log2).toBeDefined();
    expect(log2?.sessions_completed).toBe(5);
  });
});
