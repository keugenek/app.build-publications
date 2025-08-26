import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type CreatePomodoroSessionInput } from '../schema';
import { getPomodoroSessions } from '../handlers/get_pomodoro_sessions';
import { desc } from 'drizzle-orm';

// Test data
const testSession1: CreatePomodoroSessionInput = {
  startTime: new Date('2023-01-01T10:00:00Z'),
  endTime: new Date('2023-01-01T10:25:00Z'),
  isWorkSession: 1
};

const testSession2: CreatePomodoroSessionInput = {
  startTime: new Date('2023-01-01T10:30:00Z'),
  endTime: new Date('2023-01-01T10:35:00Z'),
  isWorkSession: 0
};

describe('getPomodoroSessions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(pomodoroSessionsTable).values(testSession1);
    await db.insert(pomodoroSessionsTable).values(testSession2);
  });
  
  afterEach(resetDB);

  it('should return all Pomodoro sessions', async () => {
    const result = await getPomodoroSessions();

    expect(result).toHaveLength(2);
    // Verify the structure of returned sessions
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      startTime: testSession2.startTime,
      endTime: testSession2.endTime,
      isWorkSession: testSession2.isWorkSession,
      created_at: expect.any(Date),
    });
    
    expect(result[1]).toMatchObject({
      id: expect.any(Number),
      startTime: testSession1.startTime,
      endTime: testSession1.endTime,
      isWorkSession: testSession1.isWorkSession,
      created_at: expect.any(Date),
    });
  });

  it('should return sessions ordered by start time (newest first)', async () => {
    const result = await getPomodoroSessions();

    // The sessions should be ordered by startTime descending
    expect(result[0].startTime.getTime()).toBeGreaterThan(result[1].startTime.getTime());
  });

  it('should return empty array when no sessions exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();

    const result = await getPomodoroSessions();
    expect(result).toHaveLength(0);
  });

  it('should handle sessions with proper date types', async () => {
    const result = await getPomodoroSessions();

    // Check that dates are properly parsed
    expect(result[0].startTime).toBeInstanceOf(Date);
    expect(result[0].endTime).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].startTime).toBeInstanceOf(Date);
    expect(result[1].endTime).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });
});
