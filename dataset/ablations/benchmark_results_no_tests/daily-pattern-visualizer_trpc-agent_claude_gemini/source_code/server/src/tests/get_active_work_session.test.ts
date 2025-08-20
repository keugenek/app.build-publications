import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { getActiveWorkSession } from '../handlers/get_active_work_session';

describe('getActiveWorkSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no active sessions exist', async () => {
    const result = await getActiveWorkSession();
    expect(result).toBeNull();
  });

  it('should return null when only completed sessions exist', async () => {
    // Create a completed work session
    await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T17:00:00Z'),
        is_break: false
      })
      .execute();

    const result = await getActiveWorkSession();
    expect(result).toBeNull();
  });

  it('should return active work session when one exists', async () => {
    const startTime = new Date('2024-01-15T09:00:00Z');
    
    // Create an active work session (no end_time)
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: startTime,
        end_time: null, // Active session
        is_break: false
      })
      .returning()
      .execute();

    const result = await getActiveWorkSession();
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.start_time).toEqual(startTime);
    expect(result!.end_time).toBeNull();
    expect(result!.is_break).toBe(false);
    expect(result!.date).toEqual(new Date('2024-01-15'));
  });

  it('should return active break session when one exists', async () => {
    const startTime = new Date('2024-01-15T12:00:00Z');
    
    // Create an active break session
    const insertResult = await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: startTime,
        end_time: null, // Active session
        is_break: true
      })
      .returning()
      .execute();

    const result = await getActiveWorkSession();
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.start_time).toEqual(startTime);
    expect(result!.end_time).toBeNull();
    expect(result!.is_break).toBe(true);
    expect(result!.date).toEqual(new Date('2024-01-15'));
  });

  it('should return most recent active session when multiple exist', async () => {
    const olderStartTime = new Date('2024-01-15T09:00:00Z');
    const newerStartTime = new Date('2024-01-15T14:00:00Z');
    
    // Create older active session
    await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: olderStartTime,
        end_time: null,
        is_break: false
      })
      .execute();

    // Create newer active session
    const newerInsertResult = await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: newerStartTime,
        end_time: null,
        is_break: true
      })
      .returning()
      .execute();

    const result = await getActiveWorkSession();
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(newerInsertResult[0].id);
    expect(result!.start_time).toEqual(newerStartTime);
    expect(result!.is_break).toBe(true);
  });

  it('should ignore completed sessions and return active one', async () => {
    const completedStartTime = new Date('2024-01-15T09:00:00Z');
    const activeStartTime = new Date('2024-01-15T14:00:00Z');
    
    // Create completed session (older)
    await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: completedStartTime,
        end_time: new Date('2024-01-15T12:00:00Z'),
        is_break: false
      })
      .execute();

    // Create active session (newer)
    const activeInsertResult = await db.insert(workSessionsTable)
      .values({
        date: '2024-01-15',
        start_time: activeStartTime,
        end_time: null, // Active
        is_break: false
      })
      .returning()
      .execute();

    const result = await getActiveWorkSession();
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(activeInsertResult[0].id);
    expect(result!.start_time).toEqual(activeStartTime);
    expect(result!.end_time).toBeNull();
  });

  it('should handle database with mixed session types', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create various session types
    await db.insert(workSessionsTable)
      .values([
        // Completed work session from yesterday
        {
          date: yesterday.toISOString().split('T')[0],
          start_time: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000), // 9 AM yesterday
          end_time: new Date(yesterday.getTime() + 17 * 60 * 60 * 1000), // 5 PM yesterday
          is_break: false
        },
        // Completed break from today
        {
          date: today.toISOString().split('T')[0],
          start_time: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM today
          end_time: new Date(today.getTime() + 10.5 * 60 * 60 * 1000), // 10:30 AM today
          is_break: true
        }
      ])
      .execute();

    // Create current active work session
    const activeSession = await db.insert(workSessionsTable)
      .values({
        date: today.toISOString().split('T')[0],
        start_time: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11 AM today
        end_time: null, // Active
        is_break: false
      })
      .returning()
      .execute();

    const result = await getActiveWorkSession();
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(activeSession[0].id);
    expect(result!.end_time).toBeNull();
    expect(result!.is_break).toBe(false);
  });
});
