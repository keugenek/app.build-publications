import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type GetMetricsByDateInput } from '../schema';
import { getWorkSessionsByDate } from '../handlers/get_work_sessions_by_date';

// Test input for querying work sessions
const testInput: GetMetricsByDateInput = {
  date: '2024-01-15'
};

describe('getWorkSessionsByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sessions exist for date', async () => {
    const result = await getWorkSessionsByDate(testInput);

    expect(result).toEqual([]);
  });

  it('should return work sessions for specific date', async () => {
    // Create test work sessions for the target date
    await db.insert(workSessionsTable).values([
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T11:00:00Z'),
        is_break: false
      },
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T11:00:00Z'),
        end_time: new Date('2024-01-15T11:15:00Z'),
        is_break: true
      }
    ]).execute();

    const result = await getWorkSessionsByDate(testInput);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[0].is_break).toBe(false);
    expect(result[0].start_time).toBeInstanceOf(Date);
    expect(result[0].end_time).toBeInstanceOf(Date);
    expect(result[1].is_break).toBe(true);
  });

  it('should return sessions ordered by start_time', async () => {
    // Insert sessions in reverse chronological order
    await db.insert(workSessionsTable).values([
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T14:00:00Z'),
        end_time: new Date('2024-01-15T15:00:00Z'),
        is_break: false
      },
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        is_break: false
      },
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T11:30:00Z'),
        end_time: null, // Ongoing session
        is_break: true
      }
    ]).execute();

    const result = await getWorkSessionsByDate(testInput);

    expect(result).toHaveLength(3);
    
    // Verify chronological ordering
    expect(result[0].start_time).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(result[1].start_time).toEqual(new Date('2024-01-15T11:30:00Z'));
    expect(result[2].start_time).toEqual(new Date('2024-01-15T14:00:00Z'));
  });

  it('should include both work and break sessions', async () => {
    // Create mixed work and break sessions
    await db.insert(workSessionsTable).values([
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:30:00Z'),
        is_break: false
      },
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T10:30:00Z'),
        end_time: new Date('2024-01-15T10:45:00Z'),
        is_break: true
      },
      {
        date: '2024-01-15',
        start_time: new Date('2024-01-15T10:45:00Z'),
        end_time: new Date('2024-01-15T12:00:00Z'),
        is_break: false
      }
    ]).execute();

    const result = await getWorkSessionsByDate(testInput);

    expect(result).toHaveLength(3);
    
    // Verify both work and break sessions are included
    const workSessions = result.filter(s => !s.is_break);
    const breakSessions = result.filter(s => s.is_break);
    
    expect(workSessions).toHaveLength(2);
    expect(breakSessions).toHaveLength(1);
  });

  it('should handle ongoing sessions with null end_time', async () => {
    // Create ongoing work session
    await db.insert(workSessionsTable).values({
      date: '2024-01-15',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: null, // Ongoing session
      is_break: false
    }).execute();

    const result = await getWorkSessionsByDate(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].end_time).toBeNull();
    expect(result[0].start_time).toBeInstanceOf(Date);
    expect(result[0].is_break).toBe(false);
  });

  it('should not return sessions from other dates', async () => {
    // Create sessions for different dates
    await db.insert(workSessionsTable).values([
      {
        date: '2024-01-14', // Day before
        start_time: new Date('2024-01-14T09:00:00Z'),
        end_time: new Date('2024-01-14T10:00:00Z'),
        is_break: false
      },
      {
        date: '2024-01-15', // Target date
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        is_break: false
      },
      {
        date: '2024-01-16', // Day after
        start_time: new Date('2024-01-16T09:00:00Z'),
        end_time: new Date('2024-01-16T10:00:00Z'),
        is_break: false
      }
    ]).execute();

    const result = await getWorkSessionsByDate(testInput);

    // Should only return the session from 2024-01-15
    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
  });

  it('should return all required fields for each session', async () => {
    await db.insert(workSessionsTable).values({
      date: '2024-01-15',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T10:00:00Z'),
      is_break: false
    }).execute();

    const result = await getWorkSessionsByDate(testInput);

    expect(result).toHaveLength(1);
    
    const session = result[0];
    expect(session.id).toBeDefined();
    expect(typeof session.id).toBe('number');
    expect(session.date).toEqual(new Date('2024-01-15'));
    expect(session.start_time).toBeInstanceOf(Date);
    expect(session.end_time).toBeInstanceOf(Date);
    expect(typeof session.is_break).toBe('boolean');
    expect(session.created_at).toBeInstanceOf(Date);
  });
});
