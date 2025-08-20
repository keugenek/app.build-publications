import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { getDailySessionSummary } from '../handlers/get_daily_session_summary';

describe('getDailySessionSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no sessions exist for the date', async () => {
    const result = await getDailySessionSummary('2024-01-01');

    expect(result.date).toEqual('2024-01-01');
    expect(result.work_sessions_count).toEqual(0);
    expect(result.break_sessions_count).toEqual(0);
    expect(result.total_work_minutes).toEqual(0);
    expect(result.total_break_minutes).toEqual(0);
  });

  it('should use today as default when no date is provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await getDailySessionSummary();

    expect(result.date).toEqual(today);
    expect(result.work_sessions_count).toEqual(0);
    expect(result.break_sessions_count).toEqual(0);
    expect(result.total_work_minutes).toEqual(0);
    expect(result.total_break_minutes).toEqual(0);
  });

  it('should aggregate work and break sessions correctly', async () => {
    const targetDate = '2024-01-15';
    const completedAt = new Date(`${targetDate}T10:00:00.000Z`);

    // Create test sessions for the target date
    await db.insert(timerSessionsTable)
      .values([
        {
          session_type: 'work',
          duration_minutes: 25,
          completed_at: completedAt
        },
        {
          session_type: 'work',
          duration_minutes: 30,
          completed_at: new Date(`${targetDate}T11:00:00.000Z`)
        },
        {
          session_type: 'break',
          duration_minutes: 5,
          completed_at: new Date(`${targetDate}T12:00:00.000Z`)
        },
        {
          session_type: 'break',
          duration_minutes: 10,
          completed_at: new Date(`${targetDate}T13:00:00.000Z`)
        }
      ])
      .execute();

    const result = await getDailySessionSummary(targetDate);

    expect(result.date).toEqual(targetDate);
    expect(result.work_sessions_count).toEqual(2);
    expect(result.break_sessions_count).toEqual(2);
    expect(result.total_work_minutes).toEqual(55);
    expect(result.total_break_minutes).toEqual(15);
  });

  it('should only include sessions from the specified date', async () => {
    const targetDate = '2024-01-15';
    const dayBefore = '2024-01-14';
    const dayAfter = '2024-01-16';

    // Create sessions for different days
    await db.insert(timerSessionsTable)
      .values([
        // Target date sessions
        {
          session_type: 'work',
          duration_minutes: 25,
          completed_at: new Date(`${targetDate}T10:00:00.000Z`)
        },
        {
          session_type: 'break',
          duration_minutes: 5,
          completed_at: new Date(`${targetDate}T11:00:00.000Z`)
        },
        // Day before session (should be excluded)
        {
          session_type: 'work',
          duration_minutes: 30,
          completed_at: new Date(`${dayBefore}T10:00:00.000Z`)
        },
        // Day after session (should be excluded)
        {
          session_type: 'work',
          duration_minutes: 20,
          completed_at: new Date(`${dayAfter}T10:00:00.000Z`)
        }
      ])
      .execute();

    const result = await getDailySessionSummary(targetDate);

    expect(result.date).toEqual(targetDate);
    expect(result.work_sessions_count).toEqual(1);
    expect(result.break_sessions_count).toEqual(1);
    expect(result.total_work_minutes).toEqual(25);
    expect(result.total_break_minutes).toEqual(5);
  });

  it('should handle sessions at day boundaries correctly', async () => {
    const targetDate = '2024-01-15';

    // Create sessions at the very start and end of the day
    await db.insert(timerSessionsTable)
      .values([
        // Start of day
        {
          session_type: 'work',
          duration_minutes: 25,
          completed_at: new Date(`${targetDate}T00:00:00.000Z`)
        },
        // End of day
        {
          session_type: 'break',
          duration_minutes: 10,
          completed_at: new Date(`${targetDate}T23:59:59.000Z`)
        },
        // Just before start of day (should be excluded)
        {
          session_type: 'work',
          duration_minutes: 30,
          completed_at: new Date('2024-01-14T23:59:59.999Z')
        },
        // Just after end of day (should be excluded)
        {
          session_type: 'work',
          duration_minutes: 20,
          completed_at: new Date('2024-01-16T00:00:00.000Z')
        }
      ])
      .execute();

    const result = await getDailySessionSummary(targetDate);

    expect(result.date).toEqual(targetDate);
    expect(result.work_sessions_count).toEqual(1);
    expect(result.break_sessions_count).toEqual(1);
    expect(result.total_work_minutes).toEqual(25);
    expect(result.total_break_minutes).toEqual(10);
  });

  it('should handle only work sessions', async () => {
    const targetDate = '2024-01-15';

    await db.insert(timerSessionsTable)
      .values([
        {
          session_type: 'work',
          duration_minutes: 25,
          completed_at: new Date(`${targetDate}T10:00:00.000Z`)
        },
        {
          session_type: 'work',
          duration_minutes: 30,
          completed_at: new Date(`${targetDate}T11:00:00.000Z`)
        }
      ])
      .execute();

    const result = await getDailySessionSummary(targetDate);

    expect(result.date).toEqual(targetDate);
    expect(result.work_sessions_count).toEqual(2);
    expect(result.break_sessions_count).toEqual(0);
    expect(result.total_work_minutes).toEqual(55);
    expect(result.total_break_minutes).toEqual(0);
  });

  it('should handle only break sessions', async () => {
    const targetDate = '2024-01-15';

    await db.insert(timerSessionsTable)
      .values([
        {
          session_type: 'break',
          duration_minutes: 5,
          completed_at: new Date(`${targetDate}T10:00:00.000Z`)
        },
        {
          session_type: 'break',
          duration_minutes: 15,
          completed_at: new Date(`${targetDate}T11:00:00.000Z`)
        }
      ])
      .execute();

    const result = await getDailySessionSummary(targetDate);

    expect(result.date).toEqual(targetDate);
    expect(result.work_sessions_count).toEqual(0);
    expect(result.break_sessions_count).toEqual(2);
    expect(result.total_work_minutes).toEqual(0);
    expect(result.total_break_minutes).toEqual(20);
  });
});
