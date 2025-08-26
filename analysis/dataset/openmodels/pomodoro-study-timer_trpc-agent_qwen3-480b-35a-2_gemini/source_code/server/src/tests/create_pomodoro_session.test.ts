import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type CreatePomodoroSessionInput } from '../schema';
import { createPomodoroSession } from '../handlers/create_pomodoro_session';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreatePomodoroSessionInput = {
  startTime: new Date('2023-01-01T10:00:00Z'),
  endTime: new Date('2023-01-01T10:25:00Z'),
  isWorkSession: 1, // 1 for work session
};

describe('createPomodoroSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pomodoro session', async () => {
    const result = await createPomodoroSession(testInput);

    // Basic field validation
    expect(result.startTime).toEqual(testInput.startTime);
    expect(result.endTime).toEqual(testInput.endTime);
    expect(result.isWorkSession).toEqual(testInput.isWorkSession);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save pomodoro session to database', async () => {
    const result = await createPomodoroSession(testInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].startTime).toEqual(testInput.startTime);
    expect(sessions[0].endTime).toEqual(testInput.endTime);
    expect(sessions[0].isWorkSession).toEqual(testInput.isWorkSession);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a break session correctly', async () => {
    const breakInput: CreatePomodoroSessionInput = {
      startTime: new Date('2023-01-01T10:25:00Z'),
      endTime: new Date('2023-01-01T10:30:00Z'),
      isWorkSession: 0, // 0 for break session
    };

    const result = await createPomodoroSession(breakInput);

    // Verify it's a break session
    expect(result.isWorkSession).toEqual(0);
    
    // Verify in database
    const sessions = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].isWorkSession).toEqual(0);
  });
});
