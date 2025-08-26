import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { checkBreakAlert } from '../handlers/check_break_alert';

describe('checkBreakAlert', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return no break needed when no work sessions exist', async () => {
    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(0);
    expect(result.last_break_time).toBeNull();
    expect(result.message).toEqual('No work sessions found for today.');
  });

  it('should return no break needed when no active work session', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(today.getTime() - 30 * 60 * 1000);

    // Create completed work session and break session
    await db.insert(workSessionsTable)
      .values([
        {
          date: todayStr,
          start_time: twoHoursAgo,
          end_time: oneHourAgo,
          is_break: false
        },
        {
          date: todayStr,
          start_time: thirtyMinutesAgo,
          end_time: new Date(today.getTime() - 15 * 60 * 1000),
          is_break: true
        }
      ])
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(0);
    expect(result.last_break_time).toBeInstanceOf(Date);
    expect(result.message).toEqual('No active work session detected.');
  });

  it('should detect short work session not needing break', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000);

    // Create ongoing work session (2 hours)
    await db.insert(workSessionsTable)
      .values({
        date: todayStr,
        start_time: twoHoursAgo,
        end_time: null, // Ongoing session
        is_break: false
      })
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(2);
    expect(result.last_break_time).toBeNull();
    expect(result.message).toMatch(/Currently working for 2\.0 hours/);
    expect(result.message).toMatch(/2\.0 hours until break recommended/);
  });

  it('should detect long work session needing break', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fiveHoursAgo = new Date(today.getTime() - 5 * 60 * 60 * 1000);

    // Create ongoing work session (5 hours)
    await db.insert(workSessionsTable)
      .values({
        date: todayStr,
        start_time: fiveHoursAgo,
        end_time: null, // Ongoing session
        is_break: false
      })
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(true);
    expect(result.continuous_work_hours).toBe(5);
    expect(result.last_break_time).toBeNull();
    expect(result.message).toMatch(/You've been working for 5\.0 hours straight/);
    expect(result.message).toMatch(/Consider taking a break!/);
  });

  it('should reset continuous work time after break', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixHoursAgo = new Date(today.getTime() - 6 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(today.getTime() - 4 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(today.getTime() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);

    // Create work session, then break, then current work session
    await db.insert(workSessionsTable)
      .values([
        {
          date: todayStr,
          start_time: sixHoursAgo,
          end_time: fourHoursAgo, // 2-hour work session
          is_break: false
        },
        {
          date: todayStr,
          start_time: threeHoursAgo,
          end_time: twoHoursAgo, // 1-hour break
          is_break: true
        },
        {
          date: todayStr,
          start_time: oneHourAgo,
          end_time: null, // Current 1-hour work session
          is_break: false
        }
      ])
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(1);
    expect(result.last_break_time).toBeInstanceOf(Date);
    expect(result.message).toMatch(/Currently working for 1\.0 hours/);
  });

  it('should calculate continuous work across multiple sessions without breaks', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixHoursAgo = new Date(today.getTime() - 6 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(today.getTime() - 4 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(today.getTime() - 3 * 60 * 60 * 1000);
    const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);

    // Create multiple work sessions without breaks
    await db.insert(workSessionsTable)
      .values([
        {
          date: todayStr,
          start_time: sixHoursAgo,
          end_time: fourHoursAgo, // 2-hour work session
          is_break: false
        },
        {
          date: todayStr,
          start_time: threeHoursAgo,
          end_time: oneHourAgo, // 2-hour work session
          is_break: false
        },
        {
          date: todayStr,
          start_time: oneHourAgo,
          end_time: null, // Current 1-hour work session
          is_break: false
        }
      ])
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(true);
    expect(result.continuous_work_hours).toBe(5); // 2 + 2 + 1 = 5 hours
    expect(result.last_break_time).toBeNull();
    expect(result.message).toMatch(/You've been working for 5\.0 hours straight/);
  });

  it('should handle ongoing break session correctly', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);

    // Create ongoing break session
    await db.insert(workSessionsTable)
      .values({
        date: todayStr,
        start_time: oneHourAgo,
        end_time: null, // Ongoing break
        is_break: true
      })
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(0);
    expect(result.last_break_time).toBeNull();
    expect(result.message).toEqual('No active work session detected.');
  });

  it('should find last break time when break exists', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fourHoursAgo = new Date(today.getTime() - 4 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(today.getTime() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);

    await db.insert(workSessionsTable)
      .values([
        {
          date: todayStr,
          start_time: fourHoursAgo,
          end_time: threeHoursAgo,
          is_break: false
        },
        {
          date: todayStr,
          start_time: twoHoursAgo,
          end_time: oneHourAgo, // Completed break
          is_break: true
        }
      ])
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false);
    expect(result.continuous_work_hours).toBe(0);
    expect(result.last_break_time).toBeInstanceOf(Date);
    expect(result.last_break_time?.getTime()).toBe(twoHoursAgo.getTime());
  });

  it('should handle edge case of exactly 4 hours work', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const exactlyFourHoursAgo = new Date(today.getTime() - 4 * 60 * 60 * 1000);

    await db.insert(workSessionsTable)
      .values({
        date: todayStr,
        start_time: exactlyFourHoursAgo,
        end_time: null,
        is_break: false
      })
      .execute();

    const result = await checkBreakAlert();

    expect(result.should_take_break).toBe(false); // Should be false for exactly 4 hours
    expect(result.continuous_work_hours).toBe(4);
    expect(result.message).toMatch(/Currently working for 4\.0 hours/);
    expect(result.message).toMatch(/0\.0 hours until break recommended/);
  });
});
